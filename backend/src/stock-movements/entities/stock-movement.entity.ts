import { RawMaterial } from '../../raw-materials/entities/raw-material.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

// Definir el tipo de movimiento
export enum MovementType {
  ENTRY = 'entry', // Entrada de stock
  EXIT = 'exit',   // Salida de stock
}

@Entity('stock_movements')
export class StockMovement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: MovementType,
  })
  type: MovementType;

  @Column({ type: 'decimal', precision: 10, scale: 2 }) // Permitir decimales para stock
  quantity: number; // Siempre positivo, el tipo define si suma o resta

  @CreateDateColumn()
  date: Date; // Fecha en que se registra el movimiento

  @Column({ type: 'text', nullable: true })
  notes?: string; // Notas adicionales (ej. motivo, referencia)

  // Relación con RawMaterial
  @ManyToOne(() => RawMaterial, { eager: false }) // No cargar RawMaterial por defecto
  @JoinColumn({ name: 'rawMaterialId' })
  rawMaterial: RawMaterial;

  @Column()
  rawMaterialId: number; // Clave foránea

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true }) // Guardará el stock después del movimiento
  stockAfterMovement?: number;
} 