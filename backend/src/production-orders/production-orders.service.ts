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
    // TODO: Generar orderNumber automáticamente?
    // TODO: Verificar si el producto existe y tiene composición?
    
    const newOrder = this.orderRepository.create({
      ...createDto,
      status: ProductionOrderStatus.PENDING, // Estado inicial
    });
    return this.orderRepository.save(newOrder);
  }

  findAll(): Promise<ProductionOrder[]> {
    return this.orderRepository.find({ relations: ['product'], order: { createdAt: 'DESC'} });
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
    if (order.status !== ProductionOrderStatus.PENDING) {
      throw new BadRequestException('La orden de producción ya no está pendiente.');
    }

    // 1. Obtener producto y su composición
    // Usamos el ID de la orden o el objeto producto ya cargado si eager es confiable
    const product = await this.productsService.findOne(order.productId); 
    if (!product.composition || product.composition.length === 0) {
      throw new BadRequestException(`El producto ${product.name} (${product.code}) no tiene una composición definida.`);
    }

    // 2. Verificar stock de todas las materias primas necesarias
    const stockErrors: string[] = [];
    for (const item of product.composition) {
      const requiredQuantity = Number(item.quantity) * order.quantityToProduce;
      // Obtener la materia prima específica para verificar stock actual
      try {
        const rawMaterial = await this.rawMaterialsService.findOne(item.rawMaterialId);
        const currentStock = Number(rawMaterial.stock);
        if (currentStock < requiredQuantity) {
          stockErrors.push(`Stock insuficiente para ${rawMaterial.name}: se necesitan ${requiredQuantity.toFixed(3)} ${rawMaterial.unit}, disponibles ${currentStock.toFixed(2)} ${rawMaterial.unit}`);
        }
      } catch (error) {
        // Capturar NotFoundException si una materia prima de la composición no existe
         if (error instanceof NotFoundException) {
            stockErrors.push(`Materia prima con ID ${item.rawMaterialId} (parte de la composición) no encontrada.`);
        } else {
            throw error; // Relanzar otros errores inesperados
        }
      }
    }

    // 4. Si NO hay stock, lanzar BadRequestException
    if (stockErrors.length > 0) {
      throw new BadRequestException(`No se puede iniciar la producción por falta de stock: \n- ${stockErrors.join('\n- ')}`);
    }

    // 3. Si hay stock, cambiar estado a IN_PROGRESS y guardar
    order.status = ProductionOrderStatus.IN_PROGRESS;
    // 5. Establecer startedAt
    order.startedAt = new Date();
    
    console.log(`Iniciando producción para la orden ${order.id} - ${product.name}...`);
    return this.orderRepository.save(order);
  }

  private async completeProduction(order: ProductionOrder): Promise<ProductionOrder> {
    if (order.status !== ProductionOrderStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'Solo se puede completar una orden que está en progreso.',
      );
    }

    this.logger.log(`Intentando completar producción para la orden ${order.id}...`);

    // Usar una transacción
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 2. Obtener producto y composición (usar el producto ya cargado por eager)
      const product = order.product;
      if (!product.composition || product.composition.length === 0) {
        // Esta verificación también está en start, pero es bueno tenerla aquí por si acaso
        throw new BadRequestException(`El producto ${product.name} no tiene composición definida.`);
      }

      // 3. Crear movimientos de stock de SALIDA para MP consumidas
      this.logger.log(`Generando movimientos de stock de salida para orden ${order.id}...`);
      for (const item of product.composition) {
        const consumedQuantity = Number(item.quantity) * order.quantityToProduce;
        
        // Usaremos el stockMovementsService dentro de la transacción
        // Necesitamos asegurar que los repositorios usados por este servicio
        // sean manejados por el queryRunner de la transacción.
        // Una forma es pasar el queryRunner a los métodos del servicio si están diseñados para ello,
        // o usar directamente los repositorios con el manager del queryRunner.
        // Por simplicidad aquí, asumiremos que createMovement puede fallar y la transacción hará rollback.
        // Idealmente, se refactorizaría createMovement para aceptar un EntityManager.

        await this.stockMovementsService.createMovement({
          rawMaterialId: item.rawMaterialId,
          type: MovementType.EXIT,
          quantity: consumedQuantity,
          notes: `Consumo para Orden de Producción #${order.orderNumber || order.id}`,
        });
        this.logger.debug(`Movimiento de salida creado para RM ${item.rawMaterialId}: ${consumedQuantity}`);
      }

      // 4. Actualizar el stock del PRODUCTO FINAL
      this.logger.log(`Actualizando stock del producto ${product.id} para orden ${order.id}...`);
      const currentProductStock = Number(product.stock); // Obtener stock actual del producto
      const newProductStock = currentProductStock + order.quantityToProduce;
      
      // Actualizar SOLO el stock usando productsService.update
      await this.productsService.update(product.id, { stock: newProductStock });
      this.logger.debug(`Stock del producto ${product.id} actualizado a ${newProductStock}`);

      // 5. Cambiar estado a COMPLETED y guardar
      order.status = ProductionOrderStatus.COMPLETED;
      // 6. Establecer completedAt
      order.completedAt = new Date();
      
      // Guardar la orden actualizada usando el manager de la transacción
      const savedOrder = await queryRunner.manager.save(order);
      this.logger.log(`Orden ${order.id} marcada como COMPLETADA.`);

      // Si todo fue bien, confirmar la transacción
      await queryRunner.commitTransaction();
      return savedOrder; 

    } catch (error) {
      // Si algo falla, revertir la transacción
      this.logger.error(`Error al completar orden ${order.id}. Reversando transacción.`, error.stack);
      await queryRunner.rollbackTransaction();
      // Relanzar el error para que Nest lo maneje
      // Podríamos mapear errores específicos (ej. stock insuficiente durante createMovement)
      throw error; 
    } finally {
      // Siempre liberar el queryRunner
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

} 