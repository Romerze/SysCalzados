// backend/src/sales-orders/entities/sales-order-item.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SalesOrder } from './sales-order.entity';
import { Product } from '../../products/entities/product.entity'; // Adjust path if needed

@Entity('sales_order_items')
export class SalesOrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  orderId: number;

  @ManyToOne(() => SalesOrder, (order) => order.items, { onDelete: 'CASCADE' }) // Si se borra la orden, se borra el item
  @JoinColumn({ name: 'orderId' })
  order: SalesOrder;

  @Column()
  productId: number;

  @ManyToOne(() => Product, { eager: true, onDelete: 'RESTRICT' }) // No permitir borrar producto si está en un pedido? O 'SET NULL'?
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number; // Precio al momento de crear el ítem del pedido

  // Se podría añadir descuento específico del ítem, etc.

  // Calculado: subtotal = quantity * unitPrice
  getSubtotal(): number {
    return this.quantity * this.unitPrice;
  }
} 