import { IsInt, IsNotEmpty, IsNumber, IsPositive, Min } from 'class-validator';

export class CreateSalesOrderItemDto {
  @IsNotEmpty({ message: 'El ID del producto es requerido.' })
  @IsInt({ message: 'El ID del producto debe ser un número entero.' })
  productId: number;

  @IsNotEmpty({ message: 'La cantidad es requerida.' })
  @IsInt({ message: 'La cantidad debe ser un número entero.' })
  @Min(1, { message: 'La cantidad debe ser al menos 1.' })
  quantity: number;

  @IsNotEmpty({ message: 'El precio unitario es requerido.' })
  @IsNumber({}, { message: 'El precio unitario debe ser un número.' })
  @IsPositive({ message: 'El precio unitario debe ser positivo.' })
  unitPrice: number;
} 