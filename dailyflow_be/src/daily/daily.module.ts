import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Daily } from './entities/daily.entity';
import { DailyController } from './daily.controller';
import { DailyService } from './daily.service';
import { AiModule } from '../ai/ai.module';
import { AsanaModule } from '../asana/asana.module';

@Module({
  imports: [TypeOrmModule.forFeature([Daily]), AiModule, AsanaModule],
  controllers: [DailyController],
  providers: [DailyService],
})
export class DailyModule {}
