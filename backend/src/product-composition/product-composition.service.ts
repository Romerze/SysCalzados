import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductComposition } from './entities/product-composition.entity';
import { CreateProductCompositionDto } from './dto/create-product-composition.dto';
import { UpdateProductCompositionDto } from './dto/update-product-composition.dto';

@Injectable()
export class ProductCompositionService {
  constructor(
    @InjectRepository(ProductComposition)
    private readonly compositionRepository: Repository<ProductComposition>,
  ) {}

  async create(createDto: CreateProductCompositionDto): Promise<ProductComposition> {
    // Aquí podríamos añadir lógica para verificar si ya existe la combinación
    // product/rawMaterial antes de crearla, o manejarlo a nivel de BD con índices únicos.
    const newItem = this.compositionRepository.create(createDto);
    return this.compositionRepository.save(newItem);
  }

  findAllByProduct(productId: number): Promise<ProductComposition[]> {
    return this.compositionRepository.find({
      where: { productId },
      relations: ['rawMaterial'], // Incluir datos de la materia prima
    });
  }

  async findOne(id: number): Promise<ProductComposition> {
    const item = await this.compositionRepository.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Composition item with ID ${id} not found`);
    }
    return item;
  }

  async update(id: number, updateDto: UpdateProductCompositionDto): Promise<ProductComposition> {
    const item = await this.findOne(id); // Reutiliza findOne para verificar existencia
    // Solo actualizamos la cantidad según el DTO
    if (updateDto.quantity !== undefined) {
        item.quantity = updateDto.quantity;
    }
    return this.compositionRepository.save(item);
  }

  async remove(id: number): Promise<void> {
    const item = await this.findOne(id); // Verificar existencia
    await this.compositionRepository.remove(item);
  }

  // Método auxiliar para eliminar toda la composición de un producto (útil al actualizar)
  async removeAllByProduct(productId: number): Promise<void> {
    await this.compositionRepository.delete({ productId });
  }
} 