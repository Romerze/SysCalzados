import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/entities/user.entity'; // Importar User si no se importó antes

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  // Este método ya no valida, asume que el usuario ya fue validado antes
  async login(user: Omit<User, 'password'>) {
    const payload = { email: user.email, sub: user.id }; // sub es el estándar para subject (ID del usuario)
    return {
      access_token: this.jwtService.sign(payload), // Genera el token firmado
    };
  }

  // El método validateUser ahora pertenece a UsersService, pero AuthService lo llama
  // Podríamos mover la lógica de validación aquí si quisiéramos separar más
}
