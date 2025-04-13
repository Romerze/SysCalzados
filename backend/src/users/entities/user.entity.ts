import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string; // Guardaremos el hash de la contraseña, no la contraseña en texto plano

  // Podemos añadir más campos aquí más adelante (nombre, rol, fecha_creacion, etc.)
} 