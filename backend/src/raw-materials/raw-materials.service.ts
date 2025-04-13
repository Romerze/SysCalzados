import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRawMaterialDto } from './dto/create-raw-material.dto';
import { UpdateRawMaterialDto } from './dto/update-raw-material.dto';
import { RawMaterial } from './entities/raw-material.entity';

@Injectable()
export class RawMaterialsService {
  constructor(
    @InjectRepository(RawMaterial)
    private readonly rawMaterialRepository: Repository<RawMaterial>,
  ) {}

  async create(createRawMaterialDto: CreateRawMaterialDto): Promise<RawMaterial> {
    const newRawMaterial = this.rawMaterialRepository.create(createRawMaterialDto);
    // Si se proporciona supplierId, se asigna automáticamente por TypeORM
    return await this.rawMaterialRepository.save(newRawMaterial);
  }

  async findAll(): Promise<RawMaterial[]> {
    // Podríamos querer cargar la relación con el proveedor:
    // return await this.rawMaterialRepository.find({ relations: ['supplier'] });
    return await this.rawMaterialRepository.find();
  }

  async findOne(id: number): Promise<RawMaterial> {
    // Podríamos querer cargar la relación con el proveedor:
    // const rawMaterial = await this.rawMaterialRepository.findOne({ where: { id }, relations: ['supplier'] });
    const rawMaterial = await this.rawMaterialRepository.findOne({ where: { id } });
    if (!rawMaterial) {
      throw new NotFoundException(`Materia prima con ID "${id}" no encontrada`);
    }
    return rawMaterial;
  }

  async update(id: number, updateRawMaterialDto: UpdateRawMaterialDto): Promise<RawMaterial> {
    const rawMaterial = await this.rawMaterialRepository.preload({
      id: id,
      ...updateRawMaterialDto,
    });
    if (!rawMaterial) {
      throw new NotFoundException(`Materia prima con ID "${id}" no encontrada para actualizar`);
    }
    return await this.rawMaterialRepository.save(rawMaterial);
  }

  async remove(id: number): Promise<void> {
    const result = await this.rawMaterialRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Materia prima con ID "${id}" no encontrada para eliminar`);
    }
  }
}
