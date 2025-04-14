import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ProductionOrderStatus } from '../entities/production-order.entity';

export class UpdateProductionOrderDto {
  @IsOptional()
  @IsEnum(ProductionOrderStatus)
  status?: ProductionOrderStatus;

  @IsOptional()
  @IsString()
  notes?: string;
  
  // No incluimos productId ni quantityToProduce para actualización
} 