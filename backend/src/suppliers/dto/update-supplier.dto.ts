import { PartialType } from '@nestjs/mapped-types';
import { CreateSupplierDto } from './create-supplier.dto';

// Hace todos los campos de CreateSupplierDto opcionales
export class UpdateSupplierDto extends PartialType(CreateSupplierDto) {} 