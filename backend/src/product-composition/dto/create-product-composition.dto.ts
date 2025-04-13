import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class CreateProductCompositionDto {
  @IsNotEmpty()
  @IsNumber()
  productId: number;

  @IsNotEmpty()
  @IsNumber()
  rawMaterialId: number;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive() // La cantidad debe ser positiva
  quantity: number;
} 