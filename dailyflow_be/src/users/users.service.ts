import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

export interface FindOrCreateUserDto {
  asanaId: string;
  name: string;
  email: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async findById(id: number): Promise<User | null> {
    return this.usersRepo.findOne({ where: { id } });
  }

  async findByAsanaId(asanaId: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { asanaId } });
  }

  async findOrCreate(dto: FindOrCreateUserDto): Promise<User> {
    let user = await this.usersRepo.findOne({ where: { asanaId: dto.asanaId } });

    if (user) {
      user.name = dto.name;
      user.email = dto.email;
      user.accessToken = dto.accessToken;
      if (dto.refreshToken) user.refreshToken = dto.refreshToken;
      if (dto.tokenExpiresAt) user.tokenExpiresAt = dto.tokenExpiresAt;
      return this.usersRepo.save(user);
    }

    const newUser = this.usersRepo.create(dto);
    return this.usersRepo.save(newUser);
  }

  async updateTokens(
    userId: number,
    accessToken: string,
    refreshToken?: string,
    tokenExpiresAt?: Date,
  ): Promise<void> {
    const update: Partial<User> = { accessToken };
    if (refreshToken) update.refreshToken = refreshToken;
    if (tokenExpiresAt) update.tokenExpiresAt = tokenExpiresAt;
    await this.usersRepo.update(userId, update);
  }

  async updateSlackWebhook(userId: number, slackWebhookUrl: string): Promise<void> {
    await this.usersRepo.update(userId, { slackWebhookUrl });
  }
}
