import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { AsanaService } from './asana.service';

@ApiTags('asana')
@ApiCookieAuth('access_token')
@Controller('asana')
@UseGuards(JwtAuthGuard)
export class AsanaController {
  constructor(private readonly asanaService: AsanaService) {}

  @Get('projects')
  @ApiOperation({ summary: 'List Asana projects for the current user workspace' })
  @ApiResponse({ status: 200, description: 'Array of Asana projects' })
  getProjects(@CurrentUser() user: User) {
    return this.asanaService.getProjects(user);
  }

  @Get('tasks')
  @ApiOperation({ summary: 'Fetch assigned Asana tasks (yesterday completed + active today)' })
  @ApiQuery({ name: 'projectGid', required: false, description: 'Filter tasks by project GID' })
  @ApiResponse({ status: 200, description: 'Object with yesterday and today task arrays' })
  getTasks(@CurrentUser() user: User, @Query('projectGid') projectGid?: string) {
    return this.asanaService.getTasks(user, projectGid);
  }
}
