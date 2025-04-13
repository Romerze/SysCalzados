import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { ProductCompositionService } from '../product-composition/product-composition.service';
import { ProductComposition } from '../product-composition/entities/product-composition.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly compositionService: ProductCompositionService,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const { code, composition: compositionData, ...productData } = createProductDto;

    const existingByCode = await this.productRepository.findOne({ where: { code } });
    if (existingByCode) {
      throw new ConflictException(`El código de producto ${code} ya está registrado.`);
    }

    const product = this.productRepository.create({
        ...productData,
        code,
    });
    
    if (product.stock === undefined) {
        product.stock = 0;
    }
    
    const savedProduct = await this.productRepository.save(product);

    if (compositionData && compositionData.length > 0) {
      const compositionItems: Partial<ProductComposition>[] = compositionData.map(item => ({
        ...item,
        productId: savedProduct.id,
      }));
      await Promise.all(
        compositionItems.map(item => this.compositionService.create(item as any))
      );
      return this.findOne(savedProduct.id);
    }

    return savedProduct;
  }

  async findAll(): Promise<Product[]> {
    return this.productRepository.find();
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado.`);
    }
    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto): Promise<Product> {
    const { code, composition: compositionData, ...restData } = updateProductDto;

    const productToUpdate = await this.findOne(id);

    if (code && code !== productToUpdate.code) {
        const existingByCode = await this.productRepository.findOne({ 
            where: { 
            code,
            id: Not(id)
            } 
        });
        if (existingByCode) {
            throw new ConflictException(`El código de producto ${code} ya está registrado por otro producto.`);
        }
    }

    if (compositionData !== undefined) {
        await this.compositionService.removeAllByProduct(id);

        if (compositionData.length > 0) {
            const compositionItems: Partial<ProductComposition>[] = compositionData.map(item => ({
                ...item,
                productId: id,
            }));
            await Promise.all(
                compositionItems.map(item => this.compositionService.create(item as any))
            );
        }
    }

    this.productRepository.merge(productToUpdate, restData);
    
    await this.productRepository.save(productToUpdate);
    
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
  }
}
