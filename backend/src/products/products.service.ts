import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { RawMaterial } from '../raw-materials/entities/raw-material.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(RawMaterial)
    private readonly rawMaterialRepository: Repository<RawMaterial>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const { code, rawMaterialIds, ...productData } = createProductDto;

    // Verificar código duplicado
    const existingByCode = await this.productRepository.findOne({ where: { code } });
    if (existingByCode) {
      throw new ConflictException(`El código de producto ${code} ya está registrado.`);
    }

    // Buscar las entidades RawMaterial correspondientes a los IDs
    let materials: RawMaterial[] = [];
    if (rawMaterialIds && rawMaterialIds.length > 0) {
      materials = await this.rawMaterialRepository.findBy({ id: In(rawMaterialIds) });
      if (materials.length !== rawMaterialIds.length) {
         throw new NotFoundException(`Una o más materias primas no fueron encontradas.`);
      }
    }

    const product = this.productRepository.create({
        ...productData, 
        code,
        rawMaterials: materials,
    });
    
    if (product.stock === undefined) {
        product.stock = 0;
    }
    
    return this.productRepository.save(product);
  }

  async findAll(): Promise<Product[]> {
    // Cargar la relación rawMaterials al buscar todos (opcional, puede ser pesado)
    // return this.productRepository.find({ relations: ['rawMaterials'] });
    return this.productRepository.find();
  }

  async findOne(id: number): Promise<Product> {
    // Cargar la relación rawMaterials al buscar uno
    const product = await this.productRepository.findOne({
         where: { id },
         relations: ['rawMaterials'], // Cargar las materias primas asociadas
        });
    if (!product) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado.`);
    }
    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto): Promise<Product> {
    const { code, rawMaterialIds, ...restData } = updateProductDto;

    const productToUpdate = await this.findOne(id); // findOne ya carga las relaciones

    // Verificar código duplicado
    if (code && code !== productToUpdate.code) {
      // ... (verificación existente)
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

    // Actualizar las materias primas si se proporciona el array rawMaterialIds
    if (rawMaterialIds) { // Si viene el array (incluso vacío), actualizamos
        if (rawMaterialIds.length > 0) {
            const materials = await this.rawMaterialRepository.findBy({ id: In(rawMaterialIds) });
            if (materials.length !== rawMaterialIds.length) {
                throw new NotFoundException(`Una o más materias primas para actualizar no fueron encontradas.`);
            }
            productToUpdate.rawMaterials = materials;
        } else {
            // Si el array viene vacío, significa que queremos quitar todas las materias primas
            productToUpdate.rawMaterials = [];
        }
    }
    // Si rawMaterialIds no viene en el DTO, no se modifica la relación existente

    // Usar merge para aplicar el resto de los cambios
    this.productRepository.merge(productToUpdate, restData);
    
    return this.productRepository.save(productToUpdate);
  }

  async remove(id: number): Promise<void> {
    const product = await this.findOne(id); // Verifica si existe
    await this.productRepository.remove(product);
  }
}
