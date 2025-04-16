import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SalesOrder, SalesOrderStatus } from './entities/sales-order.entity';
import { SalesOrderItem } from './entities/sales-order-item.entity';
import { CreateSalesOrderDto } from './dto/create-sales-order.dto';
import { UpdateSalesOrderDto } from './dto/update-sales-order.dto';
import { Client } from '../clients/entities/client.entity';
import { Product } from '../products/entities/product.entity';
import { UpdateSalesOrderNotesDto } from './dto/update-sales-order-notes.dto';
import { ProductionOrdersService } from '../production-orders/production-orders.service';
import { ProductionOrder, ProductionOrderStatus } from '../production-orders/entities/production-order.entity';

// Define structure for stock check result
interface StockCheckDeficit {
  productId: number;
  productName: string;
  needed: number;
  available: number;
  deficit: number;
}

interface StockCheckResult {
  sufficient: boolean;
  deficits: StockCheckDeficit[];
}

@Injectable()
export class SalesOrdersService {
  private readonly logger = new Logger(SalesOrdersService.name);

  constructor(
    @InjectRepository(SalesOrder)
    private readonly salesOrderRepository: Repository<SalesOrder>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(SalesOrderItem)
    private readonly salesOrderItemRepository: Repository<SalesOrderItem>,
    @InjectRepository(ProductionOrder)
    private readonly productionOrderRepository: Repository<ProductionOrder>,
    private readonly dataSource: DataSource,
    private readonly productionOrdersService: ProductionOrdersService,
  ) {}

  async create(createSalesOrderDto: CreateSalesOrderDto): Promise<SalesOrder> {
    const { clientId, items, notes } = createSalesOrderDto;

    const client = await this.clientRepository.findOneBy({ id: clientId });
    if (!client) {
      throw new NotFoundException(`Cliente con ID ${clientId} no encontrado.`);
    }

    const orderItems: SalesOrderItem[] = [];
    let calculatedTotalAmount = 0;

    for (const itemDto of items) {
      if (!itemDto?.productId) {
         throw new BadRequestException('Se encontró un ítem sin ID de producto.');
      }
      const product = await this.productRepository.findOneBy({ id: itemDto.productId });
      if (!product) {
        throw new NotFoundException(`Producto con ID ${itemDto.productId} no encontrado.`);
      }
      if (product.sellingPrice === null || product.sellingPrice === undefined) {
         throw new BadRequestException(`Producto ${product.name} no tiene precio de venta.`);
      }
      const quantity = Number(itemDto.quantity);
      if (isNaN(quantity) || quantity <= 0) {
          throw new BadRequestException(`Cantidad inválida para ${product.name}.`);
      }
      const unitPrice = Number(product.sellingPrice);
      if (isNaN(unitPrice) || unitPrice < 0) {
           throw new BadRequestException(`Precio unitario inválido (${product.sellingPrice}) para ${product.name}.`);
       }

      const orderItem = new SalesOrderItem();
      orderItem.productId = product.id;
      orderItem.product = product;
      orderItem.quantity = quantity;
      orderItem.unitPrice = unitPrice;

      orderItems.push(orderItem);
      calculatedTotalAmount += quantity * unitPrice;
    }

    const newOrder = this.salesOrderRepository.create({
      clientId,
      client,
      notes,
      items: orderItems,
      status: SalesOrderStatus.PENDING,
      orderNumber: this.generateOrderNumber(),
      totalAmount: calculatedTotalAmount,
    });

    try {
      return await this.salesOrderRepository.save(newOrder);
    } catch (error) {
       const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      const err: any = error;
      const errorQuery =
        typeof err === 'object' && err !== null && 'query' in err
          ? err.query
          : undefined;
      const errorParameters =
        typeof err === 'object' && err !== null && 'parameters' in err
          ? err.parameters
          : undefined;

      this.logger.error(`Error saving sales order: ${errorMessage}`, {
          stack: errorStack,
          query: errorQuery,
          parameters: errorParameters,
       });
      throw new BadRequestException('Error al crear la orden de venta.');
    }
  }

  async findAll(): Promise<SalesOrder[]> {
    // Use QueryBuilder with loadRelationCountAndMap for cleaner counts
    return (
      this.salesOrderRepository
        .createQueryBuilder('salesOrder')
        .leftJoinAndSelect('salesOrder.client', 'client') // Load client relation
        // Count ALL related Production Orders
        .loadRelationCountAndMap(
          'salesOrder.totalProductionOrders', // Property to map count onto
          'salesOrder.productionOrders',       // Relation to count
        )
        // Count ONLY COMPLETED related Production Orders
        .loadRelationCountAndMap(
          'salesOrder.completedProductionOrders', // Property to map count onto
          'salesOrder.productionOrders',          // Relation to count
          'completedPO',                          // Alias for the relation in the subquery
          (qb) =>
            qb.where('completedPO.status = :status', {
              status: ProductionOrderStatus.COMPLETED,
            }),
        )
        .orderBy('salesOrder.orderDate', 'DESC')
        .getMany()
    );
  }

  async findOne(id: number): Promise<SalesOrder> {
    const order = await this.salesOrderRepository.findOne({
       where: { id },
       relations: {
           client: true,
           items: {
               product: true,
           },
       },
    });
    if (!order) {
      throw new NotFoundException(`Orden de venta con ID ${id} no encontrada.`);
    }
    order.items = order.items || [];
    return order;
  }

  async update(
    id: number,
    updateSalesOrderDto: UpdateSalesOrderDto,
  ): Promise<SalesOrder> {
    const order = await this.findOne(id);

    if (
      updateSalesOrderDto.items &&
      order.status === SalesOrderStatus.PENDING
    ) {
      this.logger.log(`Processing item updates for PENDING order ${id}`);

      if (!order.items) {
           throw new Error('Items relation not loaded for update.');
      }

      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      let calculatedTotalAmount = 0;
      const existingItemsMap = new Map(order.items?.map(item => [item?.id, item]) ?? []);
      const itemsToKeep = new Set<number>();

      try {
        for (const incomingItemDto of updateSalesOrderDto.items) {
          const incomingProductId = incomingItemDto?.productId;
          const incomingQuantity = Number(incomingItemDto?.quantity ?? 0);
          if (!incomingProductId) {
             this.logger.warn("Skipping item in update payload: Missing productId");
             continue;
          }
          if (isNaN(incomingQuantity) || incomingQuantity <= 0) {
             this.logger.warn(`Skipping item in update payload for product ${incomingProductId}: Invalid quantity ${incomingItemDto?.quantity}`);
             continue;
          }
          
          const existingItem = order.items?.find(item => item?.productId === incomingProductId);

          if (existingItem) {
            const existingItemId = existingItem.id;
            if (existingItemId === undefined || existingItemId === null) {
                 this.logger.error(`Found existing item for product ${incomingProductId} but it has no ID! Skipping update.`);
                 continue;
            }
            itemsToKeep.add(existingItemId);
            let updated = false;
            const existingQuantity = Number(existingItem.quantity ?? 0);
            
            if (existingQuantity !== incomingQuantity) {
              this.logger.log(`Updating quantity for item ${existingItemId} (Product ${incomingProductId}): ${existingQuantity} -> ${incomingQuantity}`);
              existingItem.quantity = incomingQuantity;
              updated = true;
            }
            
            const existingUnitPrice = Number(existingItem.unitPrice ?? 0);
            if (isNaN(existingUnitPrice) || existingUnitPrice < 0) {
                this.logger.error(`Invalid unit price (${existingItem.unitPrice}) found on existing item ${existingItemId}. Using 0 for total.`);
            }

            if (updated) {
                 await queryRunner.manager.save(SalesOrderItem, existingItem); 
            }
            calculatedTotalAmount += incomingQuantity * (isNaN(existingUnitPrice) ? 0 : existingUnitPrice);
          } else {
            this.logger.log(`Creating new item for product ${incomingProductId}`);
            const product = await queryRunner.manager.findOneBy(Product, { id: incomingProductId });
            if (!product || product.sellingPrice === null || product.sellingPrice === undefined) {
                this.logger.error(`Product ${incomingProductId} not found or has no price. Cannot create new item.`);
                continue; 
            }
            const unitPrice = Number(product.sellingPrice);
             if (isNaN(unitPrice) || unitPrice < 0) {
                 this.logger.error(`Invalid selling price (${product.sellingPrice}) for product ${incomingProductId}. Cannot create new item.`);
                 continue;
             }
            
            const newItem = this.salesOrderItemRepository.create({
               order: order,
               productId: incomingProductId,
               quantity: incomingQuantity,
               unitPrice: unitPrice,
            });
            const savedNewItem = await queryRunner.manager.save(SalesOrderItem, newItem);
            this.logger.log(`New item created with ID ${savedNewItem?.id ?? 'N/A'}`);
            calculatedTotalAmount += (savedNewItem?.quantity ?? 0) * (savedNewItem?.unitPrice ?? 0);
          }
        }

        for (const [existingId, existingItem] of existingItemsMap.entries()) {
            if (existingId !== undefined && existingId !== null && !itemsToKeep.has(existingId)) {
                this.logger.log(`Deleting item ${existingId} (Product ${existingItem?.productId ?? 'N/A'})`);
                if (existingItem) {
                    await queryRunner.manager.remove(SalesOrderItem, existingItem);
                } else {
                    this.logger.warn(`Attempted to delete item with ID ${existingId}, but item data was missing.`);
                }
            }
        }

        order.totalAmount = calculatedTotalAmount;
        await queryRunner.manager.save(SalesOrder, order);
        await queryRunner.commitTransaction();
        order.items = await this.salesOrderItemRepository.findBy({ orderId: order.id });

      } catch (error) {
         await queryRunner.rollbackTransaction();
         this.logger.error(`Error during item CRUD for order ${id}. Rolling back.`, error instanceof Error ? error.stack : undefined);
         const errorMsg = error instanceof Error ? error.message : 'Error desconocido al actualizar ítems.'
         throw new BadRequestException(`Error al actualizar los ítems del pedido: ${errorMsg}`);
      } finally {
         await queryRunner.release();
      }
    } else if (updateSalesOrderDto.items && order.status !== SalesOrderStatus.PENDING) {
        this.logger.warn(`Attempted to update items on non-PENDING order ${id}. Status: ${order.status}`);
        throw new BadRequestException(`No se pueden modificar los ítems de un pedido que no está en estado PENDIENTE.`);
    }

    if (updateSalesOrderDto.status && updateSalesOrderDto.status !== order.status) {
      const currentStatus = order.status;
      const nextStatus = updateSalesOrderDto.status as SalesOrderStatus;
      this.logger.log(`Attempting status change for order ${id}: ${currentStatus} -> ${nextStatus}`);

      if (nextStatus === SalesOrderStatus.CONFIRMED && currentStatus === SalesOrderStatus.PENDING) {
        this.logger.log(`Order ${id} moving to CONFIRMED. Checking stock...`);
        
        const orderForStockCheck = await this.findOne(id);
        if (
          !orderForStockCheck.items ||
          orderForStockCheck.items.length === 0
         ) {
             throw new BadRequestException(
               'No se pueden confirmar pedidos sin ítems.',
             );
        }

        const stockCheckResult = this._checkProductStock(orderForStockCheck);
        
        // --- Caso: Stock Insuficiente --- 
        if (!stockCheckResult.sufficient) {
          this.logger.warn(
            `Insufficient stock to confirm order ${id}. Attempting to create Production Orders for deficits.`,
          );
          
          const createdProductionOrderIds: number[] = [];
          const productionErrors: string[] = [];
          
          try {
              this.logger.log(
                `Attempting to create production orders for deficits of order ${id}`,
              );
              for (const deficit of stockCheckResult.deficits) {
                  if (deficit.deficit <= 0) continue; 
                  
                  // --- Check for existing Production Order linked via salesOrderId ---
                  // Find ANY existing Production Order linked directly by salesOrderId
                  const existingPO = await this.productionOrderRepository.findOne({
                      where: {
                          salesOrderId: order.id, // Check if a PO already exists for this specific sales order
                      },
                  });

                  // If no PO linked to this SalesOrder exists, create a new one
                  if (!existingPO) {
                      this.logger.log(
                        `No existing PO found linked to sales order ${order.id}. Creating new PO for product ${deficit.productId}.`,
                      );
                      try {
                          const productionOrderPayload = {
                              productId: deficit.productId,
                              quantityToProduce: Math.ceil(deficit.deficit),
                              notes: `Generada automáticamente para cubrir déficit del Pedido Venta #${order.orderNumber || order.id}`, // Keep notes for info
                              salesOrderId: order.id,
                          };
                          const newProdOrder =
                            await this.productionOrdersService.create(
                              productionOrderPayload,
                            );
                          this.logger.log(
                            `Created Production Order ${newProdOrder.id} (linked to SO ${order.id}) for product ${deficit.productId}, quantity ${productionOrderPayload.quantityToProduce}`,
                          );
                          createdProductionOrderIds.push(newProdOrder.id);
                      } catch (prodError) {
                          const errorMsg =
                            prodError instanceof Error
                              ? prodError.message
                              : 'Error desconocido';
                          this.logger.error(
                            `Failed to create production order for product ${deficit.productId} (SO ${order.id}, deficit ${deficit.deficit}): ${errorMsg}`,
                            prodError instanceof Error ? prodError.stack : undefined,
                          );
                          productionErrors.push(
                            `Producto ${deficit.productName} (ID: ${deficit.productId}): ${errorMsg}`,
                          );
                      }
                  } else {
                       // Log uses existingPO now, linked by ID
                       this.logger.log(
                         `Existing Production Order (ID: ${existingPO.id}, Status: ${existingPO.status}) found linked to sales order ${order.id}. Skipping creation.`,
                       );
                       // No need to check notes anymore
                  }
              } // end for loop
          } catch (error) {
              // Catch errors in the loop logic itself, though inner catches should handle PO creation errors
              this.logger.error(
                `Unexpected error during production order creation loop for order ${id}`,
                error instanceof Error ? error.stack : undefined,
              );
              productionErrors.push(
                `Error inesperado en el proceso: ${error instanceof Error ? error.message : 'Error desconocido'}`,
              );
          }

          // Construct the final error message for the user
          let message = 'Stock insuficiente para confirmar el pedido.';
          if (createdProductionOrderIds.length > 0) {
              message += ` Se generaron ${createdProductionOrderIds.length} órdenes de producción automáticamente para cubrir el déficit (IDs: ${createdProductionOrderIds.join(', ')}).`;
          }
          if (productionErrors.length > 0) {
              message += ` Errores al generar órdenes de producción: \n- ${productionErrors.join('\n- ')}`;
          }
          message +=
            ' El pedido permanecerá PENDIENTE hasta que haya stock disponible.';
          
          // Throw the exception - order confirmation is stopped here
          throw new BadRequestException(message);

        // --- Caso: Stock Suficiente --- 
        } else {
          this.logger.log(
            `Stock sufficient for all items in order ${id}. Proceeding with confirmation and stock deduction.`,
          );
          
          // Proceed with stock update within a transaction (Existing Logic)
          const queryRunner = this.dataSource.createQueryRunner();
          await queryRunner.connect();
          await queryRunner.startTransaction();
          this.logger.log(
            `Transaction started for confirming order ${id} and updating stock.`,
          );

          try {
            // Decrease stock for each product item
            for (const item of orderForStockCheck.items) {
              const product = item.product;
              const quantityToDecrease = Number(item.quantity);
              if (
                !product ||
                isNaN(quantityToDecrease) ||
                quantityToDecrease <= 0
              ) {
                 throw new Error(
                   `Invalid item data found during stock update for order ${id}. Product ID: ${item.productId}`,
                 );
              }
              const currentStock = Number(product.stock);
              const newStock = currentStock - quantityToDecrease;
              
              this.logger.debug(
                `Updating stock for product ${product.id}: ${currentStock} -> ${newStock}`,
              );
              await queryRunner.manager.update(Product, product.id, {
                stock: newStock,
               });
            }

            // Update order status
            order.status = SalesOrderStatus.CONFIRMED;
            order.confirmedAt = new Date(); 
            
            // Save updated order within the transaction
            await queryRunner.manager.save(SalesOrder, order);
            this.logger.log(`Order ${id} status updated to CONFIRMED.`);

            // Commit transaction
            await queryRunner.commitTransaction();
            this.logger.log(
              `Transaction committed for order ${id} confirmation.`,
            );
            return this.findOne(id); // Return updated order with relations

          } catch (error) {
            this.logger.error(
              `Error during stock update transaction for order ${id}. Rolling back.`,
              error instanceof Error ? error.stack : undefined,
            );
            await queryRunner.rollbackTransaction();
            const errorMsg =
              error instanceof Error
                ? error.message
                : 'Error desconocido al actualizar stock.';
            throw new BadRequestException(
              `Error al confirmar pedido y actualizar stock: ${errorMsg}`,
            );
          } finally {
            await queryRunner.release();
          }
        } // Fin del else (stock suficiente)

      } else if (nextStatus === SalesOrderStatus.SHIPPED && currentStatus === SalesOrderStatus.CONFIRMED) {
           this.logger.log(`Order ${id} moving to SHIPPED.`);
           order.status = SalesOrderStatus.SHIPPED;
           order.shippedAt = new Date();
           return this.salesOrderRepository.save(order);
           
      } else if (nextStatus === SalesOrderStatus.DELIVERED && currentStatus === SalesOrderStatus.SHIPPED) {
           this.logger.log(`Order ${id} moving to DELIVERED.`);
           order.status = SalesOrderStatus.DELIVERED;
           order.deliveredAt = new Date();
           return this.salesOrderRepository.save(order);

      } else if (nextStatus === SalesOrderStatus.CANCELLED) {
           this.logger.log(`Order ${id} moving to CANCELLED.`);

           // --- VALIDACIÓN DE ESTADO ANTES DE CANCELAR ---
           if (![SalesOrderStatus.PENDING, SalesOrderStatus.CONFIRMED].includes(currentStatus)) {
               this.logger.warn(`Attempted to cancel order ${id} from invalid status: ${currentStatus}`);
               throw new BadRequestException(`No se puede cancelar un pedido con estado: ${currentStatus}.`); 
           }
           // --- FIN VALIDACIÓN ---

           if (currentStatus === SalesOrderStatus.CONFIRMED) {
               this.logger.warn(
                 `Order ${id} was CONFIRMED. Cancelling without automatic stock replenishment.`,
               );
           }
           order.status = SalesOrderStatus.CANCELLED;
           order.cancelledAt = new Date();
           return this.salesOrderRepository.save(order);

      } else {
           this.logger.warn(
             `Invalid status transition requested for order ${id}: ${currentStatus} -> ${nextStatus}`,
           );
           throw new BadRequestException(
             `Transición de estado inválida: ${currentStatus} -> ${nextStatus}`,
           );
      }
    } else if (updateSalesOrderDto.notes !== undefined) {
        this.logger.warn(
          `Updating notes via general update endpoint for order ${id}. Consider using dedicated endpoint.`,
        );
        order.notes = updateSalesOrderDto.notes;
    }

    let needsSave = false;
    const onlyItemsUpdated = updateSalesOrderDto.items && !updateSalesOrderDto.notes && !updateSalesOrderDto.status;
 
    if (updateSalesOrderDto.notes !== undefined && order.notes !== updateSalesOrderDto.notes) {
        if (!updateSalesOrderDto.items) {
            order.notes = updateSalesOrderDto.notes;
            needsSave = true; 
            this.logger.log(`Only notes changed for order ${id}. Flagging for save.`);
        }
    }
    if (updateSalesOrderDto.status && updateSalesOrderDto.status !== SalesOrderStatus.SHIPPED) {
        needsSave = true; 
        this.logger.log(`Status changed to ${updateSalesOrderDto.status} for order ${id}. Flagging for save.`);
    }
     
    if (needsSave && !onlyItemsUpdated) {
        this.logger.log(`Performing final save for order ${id} (Notes/Status)`);
        try {
            if(updateSalesOrderDto.status) {
                order.status = updateSalesOrderDto.status;
            }
            return await this.salesOrderRepository.save(order);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            this.logger.error(`Error saving updated sales order ${id} (general update): ${errorMessage}`, error instanceof Error ? error.stack : undefined);
            throw new BadRequestException('Error al actualizar la orden de venta.');
        }
    } else {
        this.logger.log(`No final save needed for order ${id}, returning potentially modified order object.`);
        return order; 
    }
    return order;
  }

  async remove(id: number): Promise<void> {
    const order = await this.findOne(id);

    // --- LOGGING PARA DEBUG --- 
    this.logger.log(`Attempting to remove order ${id} with status: ${order?.status}`);

    if (![SalesOrderStatus.PENDING, SalesOrderStatus.CANCELLED].includes(order?.status)) {
      // --- LOGGING PARA DEBUG --- 
      this.logger.warn(`Validation FAILED for remove order ${id}. Status ${order?.status} is not PENDING or CANCELLED.`);
      throw new BadRequestException(`No se puede eliminar una orden con estado ${order?.status?.toLowerCase() ?? 'desconocido'}. Considere cancelarla.`);
    }

    // --- LOGGING PARA DEBUG --- 
    this.logger.log(`Validation PASSED for remove order ${id}. Proceeding with deletion.`);

    const result = await this.salesOrderRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Orden de venta con ID ${id} no encontrada para eliminar.`);
    }
  }

  private generateOrderNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `SO-${year}${month}${day}-${randomPart}`;
  }

  private _checkProductStock(order: SalesOrder): StockCheckResult {
    this.logger.log(`Checking stock for order ${order?.id ?? 'N/A'}`);
    const result: StockCheckResult = { sufficient: true, deficits: [] };

    if (!order?.items || order.items.length === 0) {
      this.logger.warn(`Order ${order?.id ?? 'N/A'} has no items to check stock for.`);
      return result; 
    }

    for (const item of order.items) {
      if (!item) continue;
      
      const product = item.product;
      const itemId = item.id ?? 'N/A';
      const itemProductId = item.productId ?? 'N/A';
      const itemQuantity = Number(item.quantity ?? 0);

      if (!product) {
         this.logger.error(`Product not loaded for item ${itemId} during stock check for order ${order.id}. Assuming insufficient.`);
         result.sufficient = false;
         result.deficits.push({
            productId: typeof itemProductId === 'number' ? itemProductId : 0,
            productName: `ID ${itemProductId}`,
            needed: itemQuantity,
            available: 0,
            deficit: itemQuantity
         });
         continue; 
      }
      
      const productId = product.id ?? 'N/A';
      const productName = product.name ?? 'Producto Desconocido';
      const availableStock = Number(product.stock ?? 0);

      if (isNaN(itemQuantity)) {
           this.logger.error(`Invalid quantity (${item.quantity}) for item ${itemId} (Product ${productId})`);
           result.sufficient = false;
           result.deficits.push({ productId: product.id, productName, needed: 0, available: availableStock, deficit: 0 });
           continue;
      }

      if (availableStock < itemQuantity) {
        result.sufficient = false; 
        const deficitAmount = itemQuantity - availableStock;
        result.deficits.push({
          productId: product.id, 
          productName: productName,
          needed: itemQuantity,
          available: availableStock,
          deficit: deficitAmount,
        });
        this.logger.warn(
          `Stock check failed for order ${order.id}, product ${productId} (${productName}): needed ${itemQuantity}, available ${availableStock}`
        );
      } else {
         this.logger.log(
          `Stock check passed for order ${order.id}, product ${productId} (${productName}): needed ${itemQuantity}, available ${availableStock}`
        );
      }
    }

    if (result.sufficient) {
        this.logger.log(`Stock check fully passed for order ${order.id}.`);
    }

    return result;
  }

  private async _updateStockForShippedOrder(order: SalesOrder): Promise<void> {
    this.logger.log(`Initiating stock update transaction for shipped order ${order?.id ?? 'N/A'}`);
    if (!order?.items || order.items.length === 0) {
      this.logger.warn(`Order ${order?.id ?? 'N/A'} has no items to update stock for.`);
      throw new BadRequestException("No se puede marcar como enviada una orden sin ítems.");
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const item of order.items) {
        if (!item) continue;

        const product = item.product;
        const itemId = item.id ?? 'N/A';
        const itemProductId = item.productId;

        if (!product) {
          throw new Error(`Producto no cargado para el ítem ${itemId} al actualizar stock para envío.`);
        }
        if (itemProductId === undefined || itemProductId === null) {
            throw new Error(`ID de producto faltante para el ítem ${itemId} al actualizar stock para envío.`);
        }

        const quantityToDecrease = Number(item.quantity ?? 0);
        const productName = product.name ?? 'Producto Desconocido';
        const currentStock = Number(product.stock ?? 0);
        const newStock = currentStock - quantityToDecrease;

        if (isNaN(quantityToDecrease) || quantityToDecrease <= 0) {
             throw new Error(`Cantidad inválida (${item.quantity}) para el ítem ${itemId} (Producto ${productName}) al actualizar stock.`);
        }

        if (newStock < 0) {
          throw new BadRequestException(
            `Stock insuficiente para enviar producto '${productName}'. Necesita: ${quantityToDecrease}, Disponible: ${currentStock}`
          );
        }
        
        await queryRunner.manager.update(Product, itemProductId, { stock: newStock });
        this.logger.log(`Stock for product ${product.id ?? 'N/A'} updated to ${newStock} within transaction.`);
      }

      order.status = SalesOrderStatus.SHIPPED;
      await queryRunner.manager.save(order);
      this.logger.log(`Order ${order.id} status updated to SHIPPED within transaction.`);

      await queryRunner.commitTransaction();
    } catch (error) {
      this.logger.error(`Error during stock update transaction for order ${order.id}. Rolling back.`, error instanceof Error ? error.stack : undefined);
      await queryRunner.rollbackTransaction();
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      throw new BadRequestException(`Error al actualizar stock y estado del pedido: ${errorMsg}`);
    } finally {
      await queryRunner.release();
    }
  }

  async updateNotes(id: number, updateNotesDto: UpdateSalesOrderNotesDto): Promise<SalesOrder> {
    const order = await this.salesOrderRepository.findOneBy({ id });
    if (!order) {
      throw new NotFoundException(`Orden de venta con ID ${id} no encontrada.`);
    }

    order.notes = updateNotesDto.notes === null ? undefined : updateNotesDto.notes;

    try {
      const updatedOrder = await this.salesOrderRepository.save(order);
      this.logger.log(`Notes updated successfully for order ${id}`);
      return updatedOrder;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`Error saving updated notes for order ${id}: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
      throw new BadRequestException('Error al actualizar las notas de la orden de venta.');
    }
  }
}
