import { Module } from '@nestjs/common';
import { AsanaController } from './asana.controller';
import { AsanaService } from './asana.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [AsanaController],
  providers: [AsanaService],
  exports: [AsanaService],
})
export class AsanaModule {}
