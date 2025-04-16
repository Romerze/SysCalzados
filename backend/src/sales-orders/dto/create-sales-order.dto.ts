import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
  IsArray,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateSalesOrderItemDto } from './create-sales-order-item.dto';

export class CreateSalesOrderDto {
  @IsNotEmpty({ message: 'El ID del cliente es requerido.' })
  @IsInt({ message: 'El ID del cliente debe ser un número entero.' })
  clientId: number;

  @IsOptional()
  @IsString({ message: 'Las notas deben ser texto.' })
  notes?: string;

  // Validar el array de items
  @IsArray()
  @ArrayMinSize(1, { message: 'El pedido debe tener al menos un ítem.' })
  @ValidateNested({ each: true }) // Validar cada objeto dentro del array
  @Type(() => CreateSalesOrderItemDto) // Necesario para que ValidateNested funcione con class-transformer
  items: CreateSalesOrderItemDto[];

  // El orderNumber y status se asignarán en el servicio
  // El totalAmount se calculará en el servicio
} 