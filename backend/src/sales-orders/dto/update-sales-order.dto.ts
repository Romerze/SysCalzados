import { IsEnum, IsOptional, IsString, IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { SalesOrderStatus } from '../entities/sales-order.entity';
import { SalesOrderItemDto } from './sales-order-item.dto';

export class UpdateSalesOrderDto {
  @IsOptional()
  @IsEnum(SalesOrderStatus, { message: 'El estado proporcionado no es válido.' })
  status?: SalesOrderStatus;

  @IsOptional()
  @IsString({ message: 'Las notas deben ser texto.' })
  notes?: string;

  @IsOptional()
  @IsArray({ message: 'Los ítems deben ser un array.' })
  @ValidateNested({ each: true, message: 'Cada ítem del pedido tiene errores.' })
  @ArrayMinSize(1, { message: 'Se requiere al menos un ítem para actualizar los ítems.' })
  @Type(() => SalesOrderItemDto)
  items?: SalesOrderItemDto[];

  // Otros campos actualizables podrían ir aquí (ej. dirección de envío)
} 