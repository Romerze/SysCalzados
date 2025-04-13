import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, MaxLength, IsPositive, IsInt } from 'class-validator';

export class CreateRawMaterialDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty({ message: 'La unidad es requerida' })
  @MaxLength(20)
  unit: string;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El stock debe ser un número' })
  @IsOptional() // El stock inicial puede ser opcional o empezar en 0
  @Min(0, { message: 'El stock no puede ser negativo' })
  stock?: number = 0; // Valor por defecto 0

  @IsInt({ message: 'El ID del proveedor debe ser un número entero' })
  @IsPositive({ message: 'El ID del proveedor debe ser positivo' })
  @IsOptional()
  supplierId?: number;
} 