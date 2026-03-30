import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async create(data: Partial<User>): Promise<User> {
    const existing = await this.findByEmail(data.email!);
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const user = this.userRepository.create(data);
    return this.userRepository.save(user);
  }

  async updateProfile(id: number, data: Partial<User>): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');
    Object.assign(user, data);
    return this.userRepository.save(user);
  }
}