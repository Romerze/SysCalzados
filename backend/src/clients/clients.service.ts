import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { Client } from './entities/client.entity';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {}

  async create(createClientDto: CreateClientDto): Promise<Client> {
    const { dni, email } = createClientDto;

    // Verificar DNI duplicado
    const existingByDni = await this.clientRepository.findOne({ where: { dni } });
    if (existingByDni) {
      throw new ConflictException(`El DNI ${dni} ya está registrado.`);
    }

    // Verificar Email duplicado (solo si se proporciona)
    if (email) {
      const existingByEmail = await this.clientRepository.findOne({ where: { email } });
      if (existingByEmail) {
        throw new ConflictException(`El correo electrónico ${email} ya está registrado.`);
      }
    }

    const client = this.clientRepository.create(createClientDto);
    return this.clientRepository.save(client);
  }

  async findAll(): Promise<Client[]> {
    return this.clientRepository.find();
  }

  async findOne(id: number): Promise<Client> {
    const client = await this.clientRepository.findOne({ where: { id } });
    if (!client) {
      throw new NotFoundException(`Cliente con ID ${id} no encontrado.`);
    }
    return client;
  }

  async update(id: number, updateClientDto: UpdateClientDto): Promise<Client> {
    const { dni, email, ...restData } = updateClientDto;

    // Verificar si el cliente existe antes de verificar duplicados
    const clientToUpdate = await this.findOne(id);
    
    // Verificar DNI duplicado (si se está actualizando y es diferente al actual)
    if (dni && dni !== clientToUpdate.dni) {
        const existingByDni = await this.clientRepository.findOne({ 
            where: { 
                dni,
                id: Not(id) // Excluir el cliente actual de la búsqueda
            } 
        });
        if (existingByDni) {
            throw new ConflictException(`El DNI ${dni} ya está registrado por otro cliente.`);
        }
    }

    // Verificar Email duplicado (si se está actualizando y es diferente al actual)
    if (email && email !== clientToUpdate.email) {
        const existingByEmail = await this.clientRepository.findOne({ 
             where: { 
                email,
                id: Not(id) // Excluir el cliente actual
            } 
        });
        if (existingByEmail) {
            throw new ConflictException(`El correo electrónico ${email} ya está registrado por otro cliente.`);
        }
    }

    // Usar merge en lugar de preload para aplicar los cambios al objeto existente
    this.clientRepository.merge(clientToUpdate, updateClientDto);

    return this.clientRepository.save(clientToUpdate);
    /* Alternativa con preload (menos eficiente porque hace dos consultas)
    const client = await this.clientRepository.preload({
      id: id,
      ...updateClientDto,
    });
    if (!client) {
      throw new NotFoundException(`Cliente con ID ${id} no encontrado.`);
    }
    return this.clientRepository.save(client);
    */
  }

  async remove(id: number): Promise<void> {
    const client = await this.findOne(id); // Reutiliza findOne para verificar si existe
    await this.clientRepository.remove(client); // Elimina la entidad encontrada
    // Alternativa: const result = await this.clientRepository.delete(id);
    // if (result.affected === 0) {
    //   throw new NotFoundException(`Cliente con ID ${id} no encontrado.`);
    // }
  }
}
