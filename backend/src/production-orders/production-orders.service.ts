import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ProductionOrder, ProductionOrderStatus } from './entities/production-order.entity';
import { CreateProductionOrderDto } from './dto/create-production-order.dto';
import { UpdateProductionOrderDto } from './dto/update-production-order.dto';
import { ProductsService } from '../products/products.service';
import { RawMaterialsService } from '../raw-materials/raw-materials.service';
import { StockMovementsService } from '../stock-movements/stock-movements.service';
import { MovementType } from '../stock-movements/entities/stock-movement.entity';
import { Product } from '../products/entities/product.entity';

@Injectable()
export class ProductionOrdersService {
  private readonly logger = new Logger(ProductionOrdersService.name);

  constructor(
    @InjectRepository(ProductionOrder)
    private readonly orderRepository: Repository<ProductionOrder>,
    private readonly productsService: ProductsService,
    private readonly rawMaterialsService: RawMaterialsService,
    private readonly stockMovementsService: StockMovementsService,
    private readonly dataSource: DataSource,
  ) {}

  async create(createDto: CreateProductionOrderDto): Promise<ProductionOrder> {
    const { productId, quantityToProduce, ...restData } = createDto;
    
    // --- Verify Product Exists --- 
    try {
        this.logger.debug(`Verifying product with ID: ${productId}`);
        await this.productsService.findOne(productId); // Throws NotFoundException if not found
        this.logger.debug(`Product ${productId} verified.`);
    } catch (error) {
        if (error instanceof NotFoundException) {
            this.logger.error(`Product with ID ${productId} not found. Cannot create production order.`);
            throw new BadRequestException(`El producto con ID ${productId} no existe. No se puede crear la orden.`);
        }
        // Re-throw other unexpected errors during product check
        this.logger.error(`Unexpected error verifying product ${productId}: ${error.message}`, error.stack);
        throw error; 
    }
    // --- End Product Verification ---

    const orderNumber = this._generateProductionOrderNumber(); // Generate number
    this.logger.log(`Generated production order number: ${orderNumber}`);

    const newOrder = this.orderRepository.create({
      productId,
      quantityToProduce,
      ...restData, // Include notes if provided
      orderNumber: orderNumber, // Assign generated number
      status: ProductionOrderStatus.PENDING,
    });
    
    try {
       const savedOrder = await this.orderRepository.save(newOrder);
       this.logger.log(`Production order ${savedOrder.id} created successfully.`);
       return savedOrder;
    } catch (error) {
       this.logger.error(`Failed to save production order: ${error.message}`, { 
           stack: error.stack, 
           query: error.query, 
           parameters: error.parameters 
       });
       // Consider specific error handling (e.g., unique constraint on orderNumber? Unlikely)
       throw new BadRequestException('Error al crear la orden de producción.');
    }
  }

  findAll(): Promise<ProductionOrder[]> {
    return this.orderRepository.find({ 
        relations: ['product', 'salesOrder'], 
        order: { createdAt: 'DESC'} 
    });
  }

  async findOne(id: number): Promise<ProductionOrder> {
    const order = await this.orderRepository.findOne({ where: { id }, relations: ['product'] });
    if (!order) {
      throw new NotFoundException(`Orden de producción con ID ${id} no encontrada.`);
    }
    return order;
  }

  async update(id: number, updateDto: UpdateProductionOrderDto): Promise<ProductionOrder> {
    const order = await this.findOne(id);

    if (updateDto.status === ProductionOrderStatus.IN_PROGRESS && order.status === ProductionOrderStatus.PENDING) {
      return this.startProduction(order);
    }

    if (updateDto.status === ProductionOrderStatus.COMPLETED && order.status === ProductionOrderStatus.IN_PROGRESS) {
      return this.completeProduction(order);
    }
    
    if (updateDto.status === ProductionOrderStatus.CANCELLED) {
       return this.cancelProduction(order, updateDto.notes);
    }

    // Actualización simple de notas si no hay cambio de estado relevante
    if (updateDto.notes !== undefined) {
       order.notes = updateDto.notes;
       return this.orderRepository.save(order);
    }

    return order; // Si no hay cambios válidos, devolver la orden actual
  }

  async remove(id: number): Promise<void> {
     const order = await this.findOne(id);
     if (order.status !== ProductionOrderStatus.PENDING && order.status !== ProductionOrderStatus.CANCELLED) {
         throw new BadRequestException('No se puede eliminar una orden en progreso o completada.');
     }
    await this.orderRepository.remove(order);
  }

  // --- Lógica de negocio principal --- 

  private async startProduction(order: ProductionOrder): Promise<ProductionOrder> {
    this.logger.log(`Attempting to start production for order ${order?.id ?? 'N/A'}`);
    if (order.status !== ProductionOrderStatus.PENDING) {
      throw new BadRequestException('La orden de producción no está pendiente.');
    }

    // 1. Get product and composition (safe access)
    const product = await this.productsService.findOne(order.productId);
    if (!product?.composition || product.composition.length === 0) {
      throw new BadRequestException(`El producto ${product?.name ?? order.productId} no tiene composición definida.`);
    }

    // 2. Check stock (existing logic)
    const stockErrors: string[] = [];
    for (const item of product.composition) {
        if (!item?.rawMaterialId || !item.quantity) continue; // Skip invalid composition items
        const requiredQuantity = Number(item.quantity) * order.quantityToProduce;
        try {
            const rawMaterial = await this.rawMaterialsService.findOne(item.rawMaterialId);
            const currentStock = Number(rawMaterial?.stock ?? 0);
            if (currentStock < requiredQuantity) {
                stockErrors.push(`Stock insuficiente para ${rawMaterial?.name ?? item.rawMaterialId}: necesita ${requiredQuantity.toFixed(3)}, disponibles ${currentStock.toFixed(2)}`);
            }
        } catch (error) {
            if (error instanceof NotFoundException) {
                stockErrors.push(`Materia prima ID ${item.rawMaterialId} no encontrada.`);
            } else {
                this.logger.error(`Error checking stock for RM ${item.rawMaterialId}: ${error.message}`, error.stack);
                stockErrors.push(`Error al verificar stock para RM ID ${item.rawMaterialId}.`);
            }
        }
    }

    if (stockErrors.length > 0) {
      throw new BadRequestException(`No se puede iniciar producción por falta de stock: \n- ${stockErrors.join('\n- ')}`);
    }
    
    // 3. Stock is sufficient - Start Transaction for Consumption and Status Update
    this.logger.log(`Stock sufficient for order ${order.id}. Starting transaction...`);
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        // 3a. Consume Raw Materials (Create EXIT movements)
        this.logger.log(`Consuming raw materials for order ${order.id}...`);
        for (const item of product.composition) {
            if (!item?.rawMaterialId || !item.quantity) continue; 
            const consumedQuantity = Number(item.quantity) * order.quantityToProduce;
            
            // Call createMovement without the EntityManager
            await this.stockMovementsService.createMovement({
                rawMaterialId: item.rawMaterialId,
                type: MovementType.EXIT,
                quantity: consumedQuantity,
                notes: `Consumo para Orden de Producción #${order.orderNumber || order.id}`,
            }); // Removed queryRunner.manager
             this.logger.debug(`Stock movement EXIT created for RM ${item.rawMaterialId}: ${consumedQuantity}`);
        }

        // 3b. Update Order Status and Start Time
        order.status = ProductionOrderStatus.IN_PROGRESS;
        order.startedAt = new Date();
        
        // 3c. Save the updated order within the transaction
        const savedOrder = await queryRunner.manager.save(order);
        this.logger.log(`Order ${order.id} status updated to IN_PROGRESS and saved.`);

        // 3d. Commit Transaction
        await queryRunner.commitTransaction();
        this.logger.log(`Transaction committed for starting order ${order.id}.`);
        return savedOrder;

    } catch (error) {
        this.logger.error(`Error during startProduction transaction for order ${order.id}. Rolling back.`, error instanceof Error ? error.stack : undefined);
        await queryRunner.rollbackTransaction();
        // Rethrow a user-friendly error
        throw new BadRequestException(`Error al iniciar producción y consumir materiales: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
        await queryRunner.release();
    }
  }

  private async completeProduction(order: ProductionOrder): Promise<ProductionOrder> {
    if (order.status !== ProductionOrderStatus.IN_PROGRESS) {
      throw new BadRequestException('Solo se puede completar una orden en progreso.');
    }
    this.logger.log(`Attempting to complete production for order ${order.id}...`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Get product (should be loaded by relation or refetch if needed)
      const product = await this.productsService.findOne(order.productId);
      if (!product) {
          throw new NotFoundException(`Producto ID ${order.productId} no encontrado al completar la orden ${order.id}`);
      }

      // 2. REMOVED: Raw material consumption logic (moved to startProduction)
      // this.logger.log(`Generando movimientos de stock de salida para orden ${order.id}...`);
      // for (const item of product.composition) { ... }

      // 3. Update Finished Product Stock
      this.logger.log(`Actualizando stock del producto ${product.id} para orden ${order.id}...`);
      const currentProductStock = Number(product.stock ?? 0); 
      // Ensure quantityToProduce is treated as number
      const quantityProduced = Number(order.quantityToProduce ?? 0);
      if (isNaN(quantityProduced) || quantityProduced <= 0) {
          // Should not happen if validation was correct on create
           throw new Error(`Cantidad a producir inválida (${order.quantityToProduce}) en la orden ${order.id}`);
      }
      const newProductStock = currentProductStock + quantityProduced;
      
      // Use the ProductService to update stock
      // Assumption: productsService.update handles saving the product entity
      await this.productsService.update(product.id, { stock: newProductStock });
      this.logger.debug(`Stock del producto ${product.id} actualizado a ${newProductStock}`);

      // 4. Update Order Status and Completion Time
      order.status = ProductionOrderStatus.COMPLETED;
      order.completedAt = new Date();
      
      // 5. Save the updated order within the transaction
      const savedOrder = await queryRunner.manager.save(order);
      this.logger.log(`Order ${order.id} marcada como COMPLETADA.`);

      // 6. Commit Transaction
      await queryRunner.commitTransaction();
      return savedOrder; 

    } catch (error) {
       // ... (Rollback and error handling) ...
       this.logger.error(`Error al completar orden ${order.id}. Reversando transacción.`, error instanceof Error ? error.stack : undefined);
       await queryRunner.rollbackTransaction();
       throw error; // Rethrow original error
    } finally {
      await queryRunner.release();
    }
  }
  
  private async cancelProduction(order: ProductionOrder, notes?: string): Promise<ProductionOrder> {
       console.log(`Cancelando producción para la orden ${order.id}...`);
       // Solo se pueden cancelar órdenes PENDIENTES (o quizás EN PROGRESO si no se consumió nada? - Simplificamos: solo PENDIENTES)
       if(order.status !== ProductionOrderStatus.PENDING) {
           throw new BadRequestException('Solo se pueden cancelar órdenes pendientes.');
       }
       order.status = ProductionOrderStatus.CANCELLED;
       order.notes = notes ? (order.notes ? `${order.notes}\nCancelada: ${notes}` : `Cancelada: ${notes}`) : order.notes;
       return this.orderRepository.save(order);
  }

  // --- Helper Method for Order Number --- 
  private _generateProductionOrderNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hour = now.getHours().toString().padStart(2, '0');
    const minute = now.getMinutes().toString().padStart(2, '0');
    const second = now.getSeconds().toString().padStart(2, '0'); // Add seconds
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase(); // Add short random suffix
    // Construct the new, more unique format
    return `ORD-${year}${month}${day}${hour}${minute}${second}-${randomSuffix}`;
  }

} 