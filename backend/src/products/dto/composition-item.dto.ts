import { IsInt, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class CompositionItemDto {
  @IsNotEmpty()
  @IsInt()
  rawMaterialId: number;

  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 3 }) // Permitir hasta 3 decimales
  @IsPositive()
  quantity: number;
} 