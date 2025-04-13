import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('clients') // Nombre de la tabla en la base de datos
export class Client {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  firstName: string;

  @Column({ length: 100 })
  lastName: string;

  @Column({ length: 8, unique: true }) // DNI único de 8 caracteres
  dni: string;

  @Column({ nullable: true, length: 20 }) // Teléfono opcional
  phone?: string;

  @Column({ nullable: true, unique: true, length: 100 }) // Email opcional pero único
  email?: string;

  @Column({ type: 'text', nullable: true }) // Dirección opcional (texto largo)
  address?: string;

  // Columnas de fecha automáticas (opcional, pero útil)
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 