import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { RawMaterial } from '../../raw-materials/entities/raw-material.entity';

@Entity('product_composition')
export class ProductComposition {
  @PrimaryGeneratedColumn()
  id: number;

  // Cantidad de materia prima necesaria por unidad de producto
  @Column({ type: 'decimal', precision: 10, scale: 3 }) // Permitir más decimales si es necesario
  quantity: number;

  // Relación con Producto
  @ManyToOne(() => Product, (product) => product.composition, {
    onDelete: 'CASCADE',
  }) // Si se borra el producto, se borra su composición
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column()
  productId: number;

  // Relación con Materia Prima
  @ManyToOne(() => RawMaterial, { eager: true }) // Cargar la materia prima asociada por defecto
  @JoinColumn({ name: 'rawMaterialId' })
  rawMaterial: RawMaterial;

  @Column()
  rawMaterialId: number;
} 