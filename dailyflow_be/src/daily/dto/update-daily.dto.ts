import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateDailyDto {
  @ApiProperty({ example: '**Yesterday**\nWorked on auth.\n\n**Today**\nImplement Slack.\n\n**Blockers**\nNone' })
  @IsString()
  @IsNotEmpty()
  content: string;
}
