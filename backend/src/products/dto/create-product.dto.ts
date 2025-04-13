import {
  IsString,
  IsNotEmpty,
  Length,
  IsOptional,
  IsNumber,
  Min,
  IsPositive,
  // IsDecimal, // No se está usando, usar IsNumber con maxDecimalPlaces
  IsArray,
  ArrayMinSize,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer'; // Necesario para transformar tipos (ej. string a number)

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del producto es requerido' })
  @Length(3, 150, { message: 'El nombre debe tener entre 3 y 150 caracteres' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'El código es requerido' })
  @Length(3, 50, { message: 'El código debe tener entre 3 y 50 caracteres' })
  // Podríamos añadir @Matches para un formato específico si es necesario
  code: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @IsNotEmpty({ message: 'La talla es requerida' })
  @Length(1, 10, { message: 'La talla debe tener entre 1 y 10 caracteres' })
  size: string;

  @IsString()
  @IsNotEmpty({ message: 'El color es requerido' })
  @Length(3, 50, { message: 'El color debe tener entre 3 y 50 caracteres' })
  color: string;

  @IsOptional()
  @IsNumber({}, { message: 'El stock debe ser un número' })
  @Min(0, { message: 'El stock no puede ser negativo' })
  @Type(() => Number) // Transforma el valor a número si viene como string
  stock?: number = 0; // Valor por defecto 0 si no se envía

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El precio de costo debe ser un número con máximo 2 decimales' })
  @IsPositive({ message: 'El precio de costo debe ser positivo' })
  @Type(() => Number)
  purchasePrice?: number;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El precio de venta debe ser un número con máximo 2 decimales' })
  @IsNotEmpty({ message: 'El precio de venta es requerido' })
  @IsPositive({ message: 'El precio de venta debe ser positivo' })
  @Type(() => Number)
  sellingPrice: number;

  @IsOptional()
  @IsArray({ message: 'Las materias primas deben ser un arreglo de IDs' })
  @ArrayMinSize(1, { message: 'Debe seleccionar al menos una materia prima si se proporciona el campo' })
  @IsInt({ each: true, message: 'Cada ID de materia prima debe ser un número entero' })
  @Type(() => Number) // Asegurar que los IDs sean números aunque vengan como strings
  rawMaterialIds?: number[];
} 