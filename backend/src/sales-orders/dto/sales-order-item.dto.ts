import { IsInt, IsNotEmpty, IsNumber, IsPositive, Min } from 'class-validator';

// DTO for individual items within Create/Update Sales Order DTOs
export class SalesOrderItemDto {
  @IsNotEmpty({ message: 'El ID del producto es requerido.' })
  @IsInt({ message: 'El ID del producto debe ser un número entero.' })
  @Min(1, { message: 'El ID del producto no es válido.' })
  productId: number;

  @IsNotEmpty({ message: 'La cantidad es requerida.' })
  @IsInt({ message: 'La cantidad debe ser un número entero.' })
  @Min(1, { message: 'La cantidad debe ser al menos 1.' })
  quantity: number;

  // Keep unitPrice validation consistent with create DTO
  @IsNotEmpty({ message: 'El precio unitario es requerido.' })
  @IsNumber({}, { message: 'El precio unitario debe ser un número.' })
  @IsPositive({ message: 'El precio unitario debe ser positivo.' })
  unitPrice: number;
} 