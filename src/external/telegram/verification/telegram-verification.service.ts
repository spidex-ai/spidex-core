import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import TelegramBot from 'node-telegram-bot-api';

export interface TelegramVerificationResult {
  isVerified: boolean;
  memberSince?: Date;
  error?: string;
}

@Injectable()
export class TelegramVerificationService {
  private readonly logger = new Logger(TelegramVerificationService.name);
  private bot: TelegramBot;
  private isReady = false;

  constructor(private readonly configService: ConfigService) {
    this.initializeBot();
  }

  private async initializeBot() {
    try {
      const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
      if (!token) {
        this.logger.warn('TELEGRAM_BOT_TOKEN not configured. Telegram verification will be disabled.');
        return;
      }

      this.bot = new TelegramBot(token, {
        polling: true,
      });

      // Test the bot connection
      const me = await this.bot.getMe();
      this.isReady = true;
      this.logger.log(`Telegram bot initialized: ${me.username}`);
    } catch (error) {
      this.logger.error('Failed to initialize Telegram bot:', error);
    }
  }

  /**
   * Verify if a user has joined the Telegram channel/group
   * @param telegramUserId - The Telegram user ID to check
   * @param chatId - The Telegram channel/group ID to check membership in
   * @returns Promise<TelegramVerificationResult>
   */
  async verifyMembership(telegramUserId: number): Promise<TelegramVerificationResult> {
    if (!this.isReady || !this.bot) {
      return {
        isVerified: false,
        error: 'Telegram bot not ready',
      };
    }

    try {
      // Use configured chat ID if not provided
      const targetChatId = this.configService.get<string>('TELEGRAM_CHANNEL_ID');

      if (!targetChatId) {
        return {
          isVerified: false,
          error: 'Telegram channel ID not configured',
        };
      }

      // Get chat member info
      const chatMember = await this.bot.getChatMember(targetChatId, telegramUserId);

      // Check if user is a member (not left, kicked, or restricted)
      const validStatuses = ['creator', 'administrator', 'member'];
      const isVerified = validStatuses.includes(chatMember.status);

      return {
        isVerified,
        memberSince:
          chatMember.status === 'member' && 'until_date' in chatMember
            ? new Date(chatMember.until_date * 1000)
            : undefined,
      };
    } catch (error) {
      this.logger.error(`Error verifying Telegram membership for user ${telegramUserId}:`, error);

      // Handle specific Telegram API errors
      if (error.code === 400 && error.description?.includes('user not found')) {
        return {
          isVerified: false,
          error: 'User not found in channel',
        };
      }

      if (error.code === 400 && error.description?.includes('chat not found')) {
        return {
          isVerified: false,
          error: 'Channel not found or bot not in channel',
        };
      }

      return {
        isVerified: false,
        error: error.description || error.message || 'Unknown error occurred',
      };
    }
  }

  /**
   * Get Telegram user info by username (for linking accounts)
   * @param username - Telegram username (without @)
   * @returns Promise<{ id: number; username: string } | null>
   */
  async getUserByUsername(username: string): Promise<{ id: number; username: string } | null> {
    if (!this.isReady || !this.bot) {
      return null;
    }

    try {
      // Note: Telegram Bot API doesn't provide a direct way to search users by username
      // This would require the user to interact with the bot first
      // Alternative: Use Telegram's deep linking or require users to start the bot

      this.logger.warn('getUserByUsername not fully implemented - Telegram API limitation');
      return null;
    } catch (error) {
      this.logger.error(`Error finding Telegram user by username ${username}:`, error);
      return null;
    }
  }

  /**
   * Verify channel/group exists and bot has access
   * @param chatId - The chat ID to verify
   * @returns Promise<boolean>
   */
  async verifyChatAccess(chatId: string): Promise<boolean> {
    if (!this.isReady || !this.bot) {
      return false;
    }

    try {
      const chat = await this.bot.getChat(chatId);
      this.logger.log(`Bot has access to chat: ${chat.title || chat.id}`);
      return true;
    } catch (error) {
      this.logger.error(`Bot cannot access chat ${chatId}:`, error);
      return false;
    }
  }

  /**
   * Get chat info
   * @param chatId - The chat ID
   * @returns Promise<any>
   */
  async getChatInfo(chatId: string): Promise<any> {
    if (!this.isReady || !this.bot) {
      return null;
    }

    try {
      return await this.bot.getChat(chatId);
    } catch (error) {
      this.logger.error(`Error getting chat info for ${chatId}:`, error);
      return null;
    }
  }

  /**
   * Check if the Telegram bot is ready
   */
  isBotReady(): boolean {
    return this.isReady;
  }

  /**
   * Generate a deep link for users to start the bot (for account linking)
   * @param payload - Optional payload for the deep link
   * @returns string
   */
  generateDeepLink(payload?: string): string {
    const botUsername = this.configService.get<string>('TELEGRAM_BOT_USERNAME');
    if (!botUsername) {
      return '';
    }

    const baseUrl = `https://t.me/${botUsername}`;
    return payload ? `${baseUrl}?start=${payload}` : baseUrl;
  }
}
