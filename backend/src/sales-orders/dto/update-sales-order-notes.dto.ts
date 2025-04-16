import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateSalesOrderNotesDto {
  @IsOptional() // Permitir enviar un string vacío o null para borrar notas
  @IsString({ message: 'Las notas deben ser texto.' })
  @MaxLength(500, { message: 'Las notas no pueden exceder los 500 caracteres.'}) // Añadir límite
  notes?: string | null;
} 