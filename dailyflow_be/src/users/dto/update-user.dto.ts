import { IsString, IsUrl, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
    description: 'Slack Incoming Webhook URL',
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  slackWebhookUrl?: string;
}
