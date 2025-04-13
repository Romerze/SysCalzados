import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, password } = createUserDto;

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = this.usersRepository.create({
      email,
      password: hashedPassword,
    });

    try {
      return await this.usersRepository.save(newUser);
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
        throw new ConflictException('El correo electrónico ya está registrado');
      }
      throw error;
    }
  }

  // Método para encontrar usuario por ID
  async findOne(id: number): Promise<User | null> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      // Podríamos lanzar NotFoundException aquí si se prefiere, 
      // pero JwtStrategy ya maneja el caso de usuario no encontrado
      return null;
    }
    return user;
  }

  // Método para encontrar usuario por email
  async findOneByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  // Validar credenciales de usuario
  async validateUser(
    email: string,
    pass: string,
  ): Promise<Omit<User, 'password'> | null> {
    const user = await this.findOneByEmail(email);
    if (user && (await bcrypt.compare(pass, user.password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user; // Excluir la contraseña del objeto devuelto
      return result;
    }
    return null;
  }

  // Otros métodos (findOne, findAll, update, remove) pueden ir aquí más tarde
}
