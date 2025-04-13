import { PartialType } from '@nestjs/mapped-types';
import { CreateProductCompositionDto } from './create-product-composition.dto';
import { IsNumber, IsOptional, IsPositive } from 'class-validator';

// Hereda validaciones pero hace todo opcional
export class UpdateProductCompositionDto extends PartialType(
    // Omitir productId y rawMaterialId de la actualización directa
    // Si se necesita cambiar, se borra y se crea uno nuevo.
    CreateProductCompositionDto
) {
    @IsOptional()
    @IsNumber()
    @IsPositive()
    quantity?: number;
} 