import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { SalesOrder } from '../../sales-orders/entities/sales-order.entity';

// Enum para el estado de la orden de producción
export enum ProductionOrderStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('production_orders')
export class ProductionOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ length: 50, unique: true, nullable: true })
  orderNumber: string;

  @Column()
  productId: number;

  @ManyToOne(() => Product, { eager: true })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ type: 'int', nullable: true })
  salesOrderId?: number;

  @ManyToOne(() => SalesOrder, salesOrder => salesOrder.productionOrders, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'salesOrderId' })
  salesOrder?: SalesOrder;

  @Column({ type: 'int' })
  quantityToProduce: number;

  @Column({
    type: 'enum',
    enum: ProductionOrderStatus,
    default: ProductionOrderStatus.PENDING,
  })
  status: ProductionOrderStatus;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  startedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  // Podríamos añadir una relación OneToMany a ProductionOrderLog si se necesita detalle
} 