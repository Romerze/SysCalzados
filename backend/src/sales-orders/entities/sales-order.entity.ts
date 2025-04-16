// backend/src/sales-orders/entities/sales-order.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Client } from '../../clients/entities/client.entity'; // Adjust path if needed
import { SalesOrderItem } from './sales-order-item.entity'; // Will be created next
import { ProductionOrder } from '../../production-orders/entities/production-order.entity'; // Import ProductionOrder

export enum SalesOrderStatus {
  PENDING = 'PENDING', // Pedido creado, esperando confirmación/pago
  CONFIRMED = 'CONFIRMED', // Pedido confirmado, listo para preparar/enviar
  PROCESSING = 'PROCESSING', // En proceso de preparación (opcional)
  SHIPPED = 'SHIPPED', // Pedido enviado
  DELIVERED = 'DELIVERED', // Pedido entregado (opcional)
  CANCELLED = 'CANCELLED', // Pedido cancelado
  REFUNDED = 'REFUNDED', // Pedido devuelto/reembolsado (opcional)
}

@Entity('sales_orders')
export class SalesOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ length: 50, unique: true, nullable: true }) // Permitir nulo si se genera después
  orderNumber: string; // Ejemplo: SO-2024-0001

  @Column()
  clientId: number;

  @ManyToOne(() => Client, { eager: true, onDelete: 'SET NULL' }) // Cargar cliente, si se borra cliente, poner clientId a NULL
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @CreateDateColumn()
  orderDate: Date; // Fecha de creación del pedido

  @Column({
    type: 'enum',
    enum: SalesOrderStatus,
    default: SalesOrderStatus.PENDING,
  })
  status: SalesOrderStatus;

  // Add timestamp fields for status changes
  @Column({ type: 'timestamp', nullable: true })
  confirmedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  shippedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt?: Date;

  // Relación con los ítems del pedido
  @OneToMany(() => SalesOrderItem, (item) => item.order, {
    cascade: true, // Si se guarda/elimina una orden, afecta a sus items
    eager: true,   // Cargar items automáticamente al cargar la orden
  })
  items: SalesOrderItem[];

  // Add relation to Production Orders generated from this Sales Order
  @OneToMany(() => ProductionOrder, productionOrder => productionOrder.salesOrder)
  productionOrders: ProductionOrder[]; // This side is not typically eager loaded

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  totalAmount?: number; // Calculado a partir de los items? O se guarda aquí?

  @UpdateDateColumn()
  updatedAt: Date;

  // Podríamos añadir dirección de envío, método de pago, etc.
} 