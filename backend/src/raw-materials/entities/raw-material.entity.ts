import { Supplier } from '../../suppliers/entities/supplier.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { ProductComposition } from '../../product-composition/entities/product-composition.entity';

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

  @OneToMany(() => ProductComposition, (composition) => composition.rawMaterial)
  productCompositions: ProductComposition[];

  // La relación ManyToMany con Product ya no es necesaria desde Product
  // pero la dejamos aquí comentada por si acaso o la eliminamos
  // @ManyToMany(() => Product, (product) => product.rawMaterials)
  // products: Product[];
} 