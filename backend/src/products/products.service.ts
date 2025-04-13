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

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const { code } = createProductDto;

    // Verificar código duplicado
    const existingByCode = await this.productRepository.findOne({ where: { code } });
    if (existingByCode) {
      throw new ConflictException(`El código de producto ${code} ya está registrado.`);
    }

    const product = this.productRepository.create(createProductDto);
    // Asegurarse que el stock tenga valor 0 si no se envió (aunque el DTO ya lo hace)
    if (product.stock === undefined) {
        product.stock = 0;
    }
    return this.productRepository.save(product);
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
    const { code, ...restData } = updateProductDto;

    const productToUpdate = await this.findOne(id);

    // Verificar código duplicado (si se está actualizando y es diferente al actual)
    if (code && code !== productToUpdate.code) {
      const existingByCode = await this.productRepository.findOne({ 
        where: { 
          code,
          id: Not(id) // Excluir el producto actual
        } 
      });
      if (existingByCode) {
        throw new ConflictException(`El código de producto ${code} ya está registrado por otro producto.`);
      }
    }

    // Usar merge para aplicar cambios
    this.productRepository.merge(productToUpdate, updateProductDto);
    
    return this.productRepository.save(productToUpdate);
  }

  async remove(id: number): Promise<void> {
    const product = await this.findOne(id); // Verifica si existe
    await this.productRepository.remove(product);
  }
}
