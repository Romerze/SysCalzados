import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { MovementType } from '../entities/stock-movement.entity';
import { Type } from 'class-transformer';

export class CreateStockMovementDto {
  @IsInt({ message: 'El ID de la materia prima debe ser un número entero' })
  @IsNotEmpty({ message: 'Debe seleccionar una materia prima' })
  rawMaterialId: number;

  @IsEnum(MovementType, { message: 'El tipo de movimiento debe ser entry o exit' })
  @IsNotEmpty({ message: 'El tipo de movimiento es requerido' })
  type: MovementType;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'La cantidad debe ser un número con máximo 2 decimales' })
  @IsPositive({ message: 'La cantidad debe ser un número positivo' })
  @IsNotEmpty({ message: 'La cantidad es requerida' })
  @Type(() => Number) // Para convertir si viene como string
  quantity: number;

  @IsOptional()
  @IsString()
  notes?: string;
} 