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
  // IsInt, // Remove unused import
  ValidateNested, // Añadir para validar objetos anidados
} from 'class-validator';
import { Type } from 'class-transformer'; // Necesario para transformar tipos (ej. string a number) y validar objetos anidados
import { CompositionItemDto } from './composition-item.dto'; // Importar DTO auxiliar

export class CreateProductDto {
  @IsString() // Add IsString back for name, it was likely removed by mistake
  @IsNotEmpty({ message: 'El nombre del producto es requerido' }) // Add IsNotEmpty back for name
  @Length(3, 150, { message: 'El nombre debe tener entre 3 y 150 caracteres' })
  name: string;

  // Remove validation decorators for code as it's generated by the service
  /*
  @IsString()
  @IsNotEmpty({ message: 'El código es requerido' })
  @Length(3, 50, { message: 'El código debe tener entre 3 y 50 caracteres' })
  // Podríamos añadir @Matches para un formato específico si es necesario
  */
  // Keep the property definition, maybe make it optional or remove if not needed at all in DTO
  // For now, let's just remove validation. The service should handle it.
  // Making it optional might be safer if other parts rely on it existing transiently.
  // Let's comment it out for now.
  // code: string;

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
  @IsNumber({
    maxDecimalPlaces: 2
  }, {
    message: 'El precio de costo debe ser un número con máximo 2 decimales'
  })
  @IsPositive({ message: 'El precio de costo debe ser positivo' })
  @Type(() => Number)
  purchasePrice?: number;

  @IsNumber({
    maxDecimalPlaces: 2
  }, {
    message: 'El precio de venta debe ser un número con máximo 2 decimales'
  })
  @IsNotEmpty({ message: 'El precio de venta es requerido' })
  @IsPositive({ message: 'El precio de venta debe ser positivo' })
  @Type(() => Number)
  sellingPrice: number;

  // Añadir campo para la composición
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true }) // Validar cada objeto del array
  @ArrayMinSize(1) // Si se envía, debe tener al menos un item
  @Type(() => CompositionItemDto) // Indicar el tipo de objeto del array
  composition?: CompositionItemDto[];
} 