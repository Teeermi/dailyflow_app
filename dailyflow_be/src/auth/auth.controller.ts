import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('asana')
  @ApiOperation({ summary: 'Initiate Asana OAuth2 login flow' })
  @ApiResponse({ status: 302, description: 'Redirect to Asana authorization page' })
  @UseGuards(AuthGuard('asana'))
  asanaLogin() {}

  @Get('asana/callback')
  @ApiOperation({ summary: 'Asana OAuth2 callback — sets JWT cookie and redirects to dashboard' })
  @ApiResponse({ status: 302, description: 'Redirect to frontend dashboard' })
  @UseGuards(AuthGuard('asana'))
  asanaCallback(@Req() req: any, @Res() res: Response) {
    const user: User = req.user;
    const token = this.authService.generateJwt(user);
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');

    res.cookie('access_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.configService.get('COOKIE_SECURE') === 'true',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.redirect(`${frontendUrl}/dashboard`);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiCookieAuth('access_token')
  @ApiResponse({ status: 200, description: 'Current user profile' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: User) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      slackWebhookUrl: user.slackWebhookUrl ?? null,
    };
  }

  @Post('logout')
  @ApiOperation({ summary: 'Log out and clear JWT cookie' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token');
    return { message: 'Logged out' };
  }
}
