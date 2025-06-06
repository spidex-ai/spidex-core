import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, GatewayIntentBits, Guild } from 'discord.js';

export interface DiscordVerificationResult {
  isVerified: boolean;
  memberSince?: Date;
  error?: string;
}

@Injectable()
export class DiscordVerificationService {
  private readonly logger = new Logger(DiscordVerificationService.name);
  private client: Client;
  private isReady = false;

  constructor(private readonly configService: ConfigService) {
    this.initializeClient();
  }

  private async initializeClient() {
    try {
      this.client = new Client({
        intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
      });

      this.client.once('ready', () => {
        this.isReady = true;
        this.logger.log(`Discord bot logged in as ${this.client.user?.tag}`);
      });

      this.client.on('error', error => {
        this.logger.error('Discord client error:', error);
      });

      const token = this.configService.get<string>('DISCORD_BOT_TOKEN');
      if (!token) {
        this.logger.warn('DISCORD_BOT_TOKEN not configured. Discord verification will be disabled.');
        return;
      }

      this.logger.log('Logging in to Discord...');

      await this.client.login(token);

      this.logger.log('Discord client initialized');
    } catch (error) {
      console.error(error);
      this.logger.error('Failed to initialize Discord client:', error);
    }
  }

  /**
   * Verify if a user has joined the Discord server
   * @param discordUserId - The Discord user ID to check
   * @param guildId - The Discord server (guild) ID to check membership in
   * @returns Promise<DiscordVerificationResult>
   */
  async verifyMembership(discordUserId: string, guildId?: string): Promise<DiscordVerificationResult> {
    if (!this.isReady || !this.client) {
      return {
        isVerified: false,
        error: 'Discord client not ready',
      };
    }

    try {
      // Use configured guild ID if not provided
      const targetGuildId = guildId || this.configService.get<string>('DISCORD_GUILD_ID');

      if (!targetGuildId) {
        return {
          isVerified: false,
          error: 'Discord guild ID not configured',
        };
      }

      const guild: Guild | null = this.client.guilds.cache.get(targetGuildId);
      if (!guild) {
        this.logger.error(`Guild ${targetGuildId} not found or bot not in guild`);
        return {
          isVerified: false,
          error: 'Guild not found or bot not in guild',
        };
      }

      // Fetch the member from the guild
      const member = await guild.members.fetch(discordUserId).catch(() => null);

      if (!member) {
        return {
          isVerified: false,
          error: 'User not found in guild',
        };
      }

      return {
        isVerified: true,
        memberSince: member.joinedAt || undefined,
      };
    } catch (error) {
      this.logger.error(`Error verifying Discord membership for user ${discordUserId}:`, error);
      return {
        isVerified: false,
        error: error.message || 'Unknown error occurred',
      };
    }
  }

  /**
   * Get Discord user info by username (for linking accounts)
   * @param username - Discord username (without #discriminator)
   * @returns Promise<{ id: string; username: string } | null>
   */
  async getUserByUsername(username: string): Promise<{ id: string; username: string } | null> {
    if (!this.isReady || !this.client) {
      return null;
    }

    try {
      const guildId = this.configService.get<string>('DISCORD_GUILD_ID');
      if (!guildId) {
        return null;
      }

      const guild = this.client.guilds.cache.get(guildId);
      if (!guild) {
        return null;
      }

      // Search for user by username in the guild
      const members = await guild.members.fetch();
      const member = members.find(
        m =>
          m.user.username.toLowerCase() === username.toLowerCase() ||
          m.user.globalName?.toLowerCase() === username.toLowerCase(),
      );

      if (member) {
        return {
          id: member.user.id,
          username: member.user.username,
        };
      }

      return null;
    } catch (error) {
      this.logger.error(`Error finding Discord user by username ${username}:`, error);
      return null;
    }
  }

  /**
   * Check if the Discord client is ready
   */
  isClientReady(): boolean {
    return this.isReady;
  }

  /**
   * Gracefully disconnect the Discord client
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.destroy();
      this.isReady = false;
      this.logger.log('Discord client disconnected');
    }
  }
}
