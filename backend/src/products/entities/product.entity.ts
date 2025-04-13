import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  name: string; // Nombre del modelo/producto

  @Index({ unique: true }) // Índice único para búsquedas rápidas y evitar duplicados
  @Column({ length: 50, unique: true })
  code: string; // Código único (SKU)

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ length: 10 }) // Talla (ej. "40", "9.5", "M")
  size: string; 

  @Column({ length: 50 })
  color: string;

  @Column({ type: 'int', default: 0 }) // Stock actual
  stock: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true }) // Precio de costo
  purchasePrice?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 }) // Precio de venta
  sellingPrice: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Aquí podríamos añadir relaciones en el futuro
  // @ManyToOne(() => Category, category => category.products)
  // category: Category;
  
  // @ManyToMany(() => RawMaterial)
  // @JoinTable()
  // rawMaterials: RawMaterial[];
} 