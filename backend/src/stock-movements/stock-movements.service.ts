import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { StockMovement, MovementType } from './entities/stock-movement.entity';
import { RawMaterial } from '../raw-materials/entities/raw-material.entity';

@Injectable()
export class StockMovementsService {
  constructor(
    @InjectRepository(StockMovement)
    private readonly stockMovementRepository: Repository<StockMovement>,
    @InjectRepository(RawMaterial)
    private readonly rawMaterialRepository: Repository<RawMaterial>,
  ) {}

  async createMovement(createStockMovementDto: CreateStockMovementDto): Promise<StockMovement> {
    const { rawMaterialId, type, quantity, notes } = createStockMovementDto;

    // 1. Encontrar la materia prima
    const rawMaterial = await this.rawMaterialRepository.findOne({ where: { id: rawMaterialId } });
    if (!rawMaterial) {
      throw new NotFoundException(`Materia prima con ID ${rawMaterialId} no encontrada.`);
    }

    // Convertir stock actual a número para cálculos seguros
    const currentStock = Number(rawMaterial.stock);
    const movementQuantity = Number(quantity); // Asegurar que quantity sea número

    // 2. Validar cantidad para salidas
    if (type === MovementType.EXIT) {
      if (currentStock < movementQuantity) {
        throw new BadRequestException(`Stock insuficiente. Stock actual: ${currentStock}, Cantidad a retirar: ${movementQuantity}`);
      }
      // Restar stock
      rawMaterial.stock = Number((currentStock - movementQuantity).toFixed(2)); // Restar y fijar decimales
    } else {
      // Sumar stock para entradas
      rawMaterial.stock = Number((currentStock + movementQuantity).toFixed(2)); // Sumar y fijar decimales
    }

    // Obtener el stock actualizado para guardarlo en el movimiento
    const stockAfter = rawMaterial.stock;

    // 3. Crear el registro de movimiento
    const newMovement = this.stockMovementRepository.create({
      rawMaterialId,
      type,
      quantity: movementQuantity, // Guardar la cantidad del movimiento
      notes,
      stockAfterMovement: stockAfter, // Añadir el stock resultante
      // rawMaterial: rawMaterial // No es necesario asignar el objeto aquí si solo guardamos ID
    });

    // --- Idealmente, usar una transacción --- 
    // await this.dataSource.transaction(async transactionalEntityManager => {
    //   await transactionalEntityManager.save(rawMaterial); 
    //   await transactionalEntityManager.save(newMovement);
    // });
    // --- Por ahora, guardar secuencialmente --- 
    
    // 4. Guardar la materia prima actualizada (con el nuevo stock)
    await this.rawMaterialRepository.save(rawMaterial);

    // 5. Guardar el nuevo movimiento
    const savedMovement = await this.stockMovementRepository.save(newMovement);

    return savedMovement; // Devolver el movimiento creado
  }

  async findAllMovements(rawMaterialId?: number): Promise<StockMovement[]> {
    // Permitir filtrar por materia prima (opcional)
    const findOptions = {
      relations: ['rawMaterial'], // Cargar datos de la materia prima asociada
      order: { date: 'DESC' as const }, // Ordenar por fecha descendente
      where: {}, 
    };
    if (rawMaterialId) {
        findOptions.where = { rawMaterialId: rawMaterialId };
    }
    
    return this.stockMovementRepository.find(findOptions);
  }

  // Podríamos añadir findOne, update, delete para movimientos si fuera necesario,
  // pero usualmente los movimientos no se editan ni borran una vez creados.
}
