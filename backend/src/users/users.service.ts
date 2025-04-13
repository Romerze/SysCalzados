import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const newUser = this.usersRepository.create(createUserDto);

    // Aquí iría la lógica de hashing de contraseña antes de guardar
    // newUser.password = await hashPassword(createUserDto.password); 

    return this.usersRepository.save(newUser);
  }

  // Otros métodos (findOne, findAll, update, remove) pueden ir aquí más tarde
}
