import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { User } from '../../users/entities/user.entity';

interface AsanaOAuthParams {
  expires_in?: number;
  token_type?: string;
}

@Injectable()
export class AsanaStrategy extends PassportStrategy(Strategy, 'asana') {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      authorizationURL: 'https://app.asana.com/-/oauth_authorize',
      tokenURL: 'https://app.asana.com/-/oauth_token',
      clientID: configService.get<string>('ASANA_CLIENT_ID'),
      clientSecret: configService.get<string>('ASANA_CLIENT_SECRET'),
      callbackURL: configService.get<string>('ASANA_CALLBACK_URL'),
      scope: ['default'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    params: AsanaOAuthParams,
  ): Promise<User> {
    const expiresIn: number = params?.expires_in;
    const tokenExpiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 1000)
      : undefined;

    const response = await fetch('https://app.asana.com/api/1.0/users/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Asana user profile');
    }

    const body = await response.json();
    const profile = body.data;

    const user = await this.usersService.findOrCreate({
      asanaId: profile.gid,
      name: profile.name,
      email: profile.email,
      accessToken,
      refreshToken: refreshToken || undefined,
      tokenExpiresAt,
    });

    return user;
  }
}
