import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { Supplier } from './entities/supplier.entity';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private readonly supplierRepository: Repository<Supplier>,
  ) {}

  async create(createSupplierDto: CreateSupplierDto): Promise<Supplier> {
    const newSupplier = this.supplierRepository.create(createSupplierDto);
    // Podríamos añadir manejo de errores específico aquí si fuera necesario
    return await this.supplierRepository.save(newSupplier);
  }

  async findAll(): Promise<Supplier[]> {
    return await this.supplierRepository.find();
  }

  async findOne(id: number): Promise<Supplier> {
    const supplier = await this.supplierRepository.findOne({ where: { id } });
    if (!supplier) {
      throw new NotFoundException(`Proveedor con ID "${id}" no encontrado`);
    }
    return supplier;
  }

  async update(id: number, updateSupplierDto: UpdateSupplierDto): Promise<Supplier> {
    // `preload` busca la entidad y la actualiza con los nuevos datos
    const supplier = await this.supplierRepository.preload({
      id: id,
      ...updateSupplierDto,
    });
    if (!supplier) {
      throw new NotFoundException(`Proveedor con ID "${id}" no encontrado para actualizar`);
    }
    return await this.supplierRepository.save(supplier);
  }

  async remove(id: number): Promise<void> {
    const result = await this.supplierRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Proveedor con ID "${id}" no encontrado para eliminar`);
    }
  }
}
