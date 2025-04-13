import { Injectable, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config'; // Importar ConfigService
import { UsersService } from '../users/users.service'; // Importar UsersService
import { User } from '../users/entities/user.entity'; // Importar User
// Importaremos ConfigService si usamos variables de entorno

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private usersService: UsersService,
    private configService: ConfigService, // Inyectar ConfigService
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      // Lanzar error si el secreto no está configurado
      throw new InternalServerErrorException('JWT_SECRET no configurado en variables de entorno');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Extrae token de 'Authorization: Bearer TOKEN'
      ignoreExpiration: false, // Rechazar tokens expirados
      secretOrKey: secret, // Usar la variable validada
    });
  }

  // Este método se llama después de que el token es verificado y decodificado
  async validate(payload: { sub: number; email: string }): Promise<Omit<User, 'password'> | never> {
    // `payload` es lo que pusimos al firmar el token en AuthService ({ email: user.email, sub: user.id })
    // Podemos usar el `sub` (ID de usuario) para buscar el usuario completo
    const user = await this.usersService.findOne(payload.sub); // Asumiendo que findOne busca por ID
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado o token inválido');
    }
    // Lo que retornamos aquí se adjuntará a request.user
    // Excluimos la contraseña por seguridad
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result; 
  }
} 