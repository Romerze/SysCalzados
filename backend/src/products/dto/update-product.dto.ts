import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

// Hereda todas las validaciones de CreateProductDto, pero hace todos los campos opcionales.
export class UpdateProductDto extends PartialType(CreateProductDto) {} 