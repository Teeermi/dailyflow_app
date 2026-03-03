import { Controller, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('users')
@ApiCookieAuth('access_token')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('me')
  @ApiOperation({ summary: 'Update current user settings (e.g. Slack webhook URL)' })
  @ApiResponse({ status: 200, description: 'Settings updated' })
  async updateMe(@CurrentUser() user: User, @Body() dto: UpdateUserDto) {
    if (dto.slackWebhookUrl !== undefined) {
      await this.usersService.updateSlackWebhook(user.id, dto.slackWebhookUrl);
    }
    return { ok: true };
  }
}
