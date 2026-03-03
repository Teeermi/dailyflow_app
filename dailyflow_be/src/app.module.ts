import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/entities/user.entity';
import { Daily } from './daily/entities/daily.entity';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AsanaModule } from './asana/asana.module';
import { AiModule } from './ai/ai.module';
import { DailyModule } from './daily/daily.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASS'),
        database: config.get<string>('DB_NAME'),
        entities: [User, Daily],
        migrations: [__dirname + '/database/migrations/*.{ts,js}'],
        synchronize: false,
        logging: config.get<string>('NODE_ENV') === 'development',
      }),
    }),
    UsersModule,
    AuthModule,
    AsanaModule,
    AiModule,
    DailyModule,
  ],
})
export class AppModule {}
