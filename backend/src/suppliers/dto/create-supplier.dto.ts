import { IsString, IsNotEmpty, IsOptional, IsEmail, Length, MaxLength } from 'class-validator';

export class CreateSupplierDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del proveedor es requerido' })
  @Length(3, 100, { message: 'El nombre debe tener entre 3 y 100 caracteres' })
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  contactPerson?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @IsEmail({}, { message: 'El correo electrónico debe ser válido' })
  @IsOptional()
  @MaxLength(100)
  email?: string;

  @IsString()
  @IsOptional()
  address?: string;
} 