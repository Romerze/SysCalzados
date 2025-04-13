import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('suppliers') // Especificar nombre de tabla plural
export class Supplier {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 100, nullable: true }) // Campos opcionales
  contactPerson?: string;

  @Column({ length: 20, nullable: true })
  phone?: string;

  @Column({ length: 100, nullable: true, unique: true })
  email?: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  // Podríamos añadir createdAt, updatedAt automáticamente más tarde
} 