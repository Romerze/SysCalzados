import {
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  MaxLength,
  IsOptional,
} from 'class-validator';

export class CreateProductionOrderDto {
  @IsNotEmpty()
  @IsInt()
  productId: number;

  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  quantityToProduce: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  orderNumber?: string; // Opcional, podría generarse automáticamente

  @IsOptional()
  @IsString()
  notes?: string;
} 