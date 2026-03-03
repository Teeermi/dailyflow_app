import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { DailyService } from './daily.service';
import { CreateDailyDto } from './dto/create-daily.dto';
import { UpdateDailyDto } from './dto/update-daily.dto';

@ApiTags('daily')
@ApiCookieAuth('access_token')
@Controller('daily')
@UseGuards(JwtAuthGuard)
export class DailyController {
  constructor(private readonly dailyService: DailyService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate AI standup from selected Asana tasks' })
  @ApiResponse({ status: 201, description: 'Standup generated and saved' })
  generate(@CurrentUser() user: User, @Body() dto: CreateDailyDto) {
    return this.dailyService.generate(user, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all standups for the current user' })
  @ApiResponse({ status: 200, description: 'Array of daily standups' })
  findAll(@CurrentUser() user: User) {
    return this.dailyService.findAll(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single standup by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'The standup record' })
  @ApiResponse({ status: 403, description: 'Forbidden — not your standup' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.dailyService.findOne(user, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update standup content' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Updated standup' })
  update(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDailyDto,
  ) {
    return this.dailyService.update(user, id, dto);
  }

  @Post(':id/post-to-slack')
  @ApiOperation({ summary: 'Post standup to Slack via configured webhook' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 201, description: 'Message posted to Slack' })
  @ApiResponse({ status: 400, description: 'Slack webhook not configured' })
  postToSlack(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.dailyService.postToSlack(user, id);
  }
}
