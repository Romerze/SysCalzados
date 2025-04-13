import { Supplier } from '../../suppliers/entities/supplier.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('raw_materials')
export class RawMaterial {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ length: 20 })
  unit: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  stock: number;

  @ManyToOne(() => Supplier, { nullable: true, eager: false })
  @JoinColumn({ name: 'supplierId' })
  supplier?: Supplier;

  @Column({ nullable: true })
  supplierId?: number;
} 