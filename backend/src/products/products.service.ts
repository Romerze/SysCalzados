import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { ProductCompositionService } from '../product-composition/product-composition.service';
import { ProductComposition } from '../product-composition/entities/product-composition.entity';
import { Logger } from '@nestjs/common';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly compositionService: ProductCompositionService,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const { name, size, color, composition: compositionData, ...productData } = createProductDto;

    if (!name || !size || !color) {
        throw new BadRequestException('Nombre, talla y color son requeridos para generar el código.');
    }
    const namePart = name.substring(0, 3).toUpperCase();
    const colorPart = color.substring(0, 3).toUpperCase();
    if (!namePart || !colorPart) {
         throw new BadRequestException('Nombre y color deben tener al menos 1 caracter para generar el código.');
    }
    const sizePart = size.trim(); 
    const generatedCode = `${namePart}-${sizePart}-${colorPart}`;
    this.logger.log(`Generated SKU for product '${name}': ${generatedCode}`);

    const existingByGeneratedCode = await this.productRepository.findOne({ where: { code: generatedCode } });
    if (existingByGeneratedCode) {
      throw new ConflictException(`El código de producto generado '${generatedCode}' ya existe.`);
    }

    const product = this.productRepository.create({
        ...productData,
        name,
        size,
        color,
        code: generatedCode,
    });
    
    if (product.stock === undefined || product.stock === null) {
        product.stock = 0;
    }
    
    const savedProduct = await this.productRepository.save(product);

    if (compositionData && compositionData.length > 0) {
      const compositionItems: Partial<ProductComposition>[] = compositionData.map(item => ({
        ...item,
        productId: savedProduct.id,
      }));
      await Promise.all(
        compositionItems.map(item => this.compositionService.create(item as ProductComposition))
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
    const { composition: compositionData, ...restData } = updateProductDto;

    const productToUpdate = await this.findOne(id);

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
