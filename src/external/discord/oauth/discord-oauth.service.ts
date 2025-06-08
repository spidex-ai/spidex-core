import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { BadRequestException } from '@shared/exception/exception.resolver';
import { EError } from '@constants/error.constant';

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  global_name?: string;
  avatar?: string;
  email?: string;
  verified?: boolean;
}

export interface DiscordTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

@Injectable()
export class DiscordOAuthService {
  private readonly logger = new Logger(DiscordOAuthService.name);
  private readonly DISCORD_API_BASE = 'https://discord.com/api/v10';

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string, redirectUri: string): Promise<DiscordTokenResponse> {
    const clientId = this.configService.get<string>('DISCORD_CLIENT_ID');
    const clientSecret = this.configService.get<string>('DISCORD_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new BadRequestException({
        validatorErrors: EError.DISCORD_CONFIG_MISSING,
        message: 'Discord OAuth2 configuration is missing',
      });
    }

    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    });

    console.log(params.toString());

    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.DISCORD_API_BASE}/oauth2/token`, params.toString(), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to exchange Discord code for token:', error.response?.data || error.message);
      throw new BadRequestException({
        validatorErrors: EError.DISCORD_OAUTH_FAILED,
        message: 'Failed to authenticate with Discord',
      });
    }
  }

  /**
   * Get Discord user information using access token
   */
  async getDiscordUser(accessToken: string): Promise<DiscordUser> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.DISCORD_API_BASE}/users/@me`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to get Discord user info:', error.response?.data || error.message);
      throw new BadRequestException({
        validatorErrors: EError.DISCORD_USER_INFO_FAILED,
        message: 'Failed to get Discord user information',
      });
    }
  }

  /**
   * Get user's Discord guilds (servers)
   */
  async getUserGuilds(accessToken: string): Promise<any[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.DISCORD_API_BASE}/users/@me/guilds`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to get Discord user guilds:', error.response?.data || error.message);
      throw new BadRequestException({
        validatorErrors: EError.DISCORD_GUILDS_FAILED,
        message: 'Failed to get Discord user guilds',
      });
    }
  }

  /**
   * Check if user is a member of a specific guild
   */
  async isUserInGuild(accessToken: string, guildId?: string): Promise<boolean> {
    const targetGuildId = guildId || this.configService.get<string>('DISCORD_GUILD_ID');

    if (!targetGuildId) {
      this.logger.warn('Discord guild ID not configured');
      return false;
    }

    try {
      const guilds = await this.getUserGuilds(accessToken);
      return guilds.some(guild => guild.id === targetGuildId);
    } catch (error) {
      this.logger.error('Failed to check Discord guild membership:', error);
      return false;
    }
  }

  /**
   * Generate Discord OAuth2 authorization URL
   */
  generateAuthUrl(redirectUri: string, state?: string): string {
    const clientId = this.configService.get<string>('DISCORD_CLIENT_ID');

    if (!clientId) {
      throw new BadRequestException({
        validatorErrors: EError.DISCORD_CONFIG_MISSING,
        message: 'Discord client ID not configured',
      });
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'identify guilds',
    });

    if (state) {
      params.append('state', state);
    }

    return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
  }

  /**
   * Verify Discord user and check guild membership
   */
  async verifyDiscordUser(
    code: string,
    redirectUri: string,
    requiredGuildId?: string,
  ): Promise<{
    user: DiscordUser;
    isInGuild: boolean;
    accessToken: string;
  }> {
    // Exchange code for token
    const tokenResponse = await this.exchangeCodeForToken(code, redirectUri);

    // Get user information
    const user = await this.getDiscordUser(tokenResponse.access_token);

    // Check guild membership
    const isInGuild = await this.isUserInGuild(tokenResponse.access_token, requiredGuildId);

    return {
      user,
      isInGuild,
      accessToken: tokenResponse.access_token,
    };
  }
}
