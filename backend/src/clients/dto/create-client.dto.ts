import {
  IsString,
  IsNotEmpty,
  Length,
  IsOptional,
  IsEmail,
  Matches,
  MinLength,
} from 'class-validator';

export class CreateClientDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  firstName: string;

  @IsString()
  @IsNotEmpty({ message: 'El apellido es requerido' })
  @MinLength(3, { message: 'El apellido debe tener al menos 3 caracteres' })
  lastName: string;

  @IsString()
  @IsNotEmpty({ message: 'El DNI es requerido' })
  @Length(8, 8, { message: 'El DNI debe tener exactamente 8 dígitos' })
  @Matches(/^[0-9]+$/, { message: 'El DNI solo debe contener números' })
  dni: string;

  @IsOptional()
  @IsString()
  @Length(6, 20, { message: 'El teléfono debe tener entre 6 y 20 caracteres' })
  phone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Debe proporcionar un correo electrónico válido' })
  @Length(5, 100, { message: 'El correo electrónico debe tener entre 5 y 100 caracteres' })
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;
} 