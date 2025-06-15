import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import TelegramBot from 'node-telegram-bot-api';

export interface TelegramVerificationResult {
  isVerified: boolean;
  memberSince?: Date;
  error?: string;
}

@Injectable()
export class TelegramVerificationService implements OnModuleInit {
  private readonly logger = new Logger(TelegramVerificationService.name);
  private bot: TelegramBot;
  private isReady = false;
  private initializationAttempts = 0;
  private readonly maxInitializationAttempts = 3;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.initializeBot();
  }

  /**
   * Determine if this instance should initialize the Telegram bot
   * Only one instance should handle Telegram polling to avoid 409 conflicts
   */
  private shouldInitializeTelegramBot(): boolean {
    // Check environment variable to control which instance handles Telegram
    const telegramHandler = this.configService.get<string>('TELEGRAM_HANDLER_INSTANCE');

    // If TELEGRAM_HANDLER_INSTANCE is set, only that instance should handle it
    if (telegramHandler) {
      const currentInstance = this.configService.get<string>('INSTANCE_NAME') || 'core-consumer';
      const shouldHandle = currentInstance === telegramHandler;

      this.logger.log(
        `🔍 Telegram handler check: current=${currentInstance}, expected=${telegramHandler}, shouldHandle=${shouldHandle}`,
      );
      return shouldHandle;
    }

    // Default behavior: only 'core-consumer' instance handles Telegram (not core-consumer)
    const currentInstance = this.configService.get<string>('INSTANCE_NAME') || 'core-consumer';
    const isApiInstance = currentInstance === 'core-consumer' || currentInstance.includes('core-consumer');

    this.logger.log(`🔍 Default Telegram handler logic: instance=${currentInstance}, isApiInstance=${isApiInstance}`);
    return isApiInstance;
  }

  private async initializeBot() {
    // Check if this instance should handle Telegram polling
    const shouldInitialize = this.shouldInitializeTelegramBot();

    if (!shouldInitialize) {
      this.logger.warn('🚫 Telegram bot initialization skipped - another instance is handling it');
      return;
    }

    try {
      const botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
      const telegramApiUrl = this.configService.get<string>('TELEGRAM_API_URL') || 'https://api.telegram.org';

      if (!botToken) {
        this.logger.error('Telegram bot token not configured');
        return;
      }

      this.bot = new TelegramBot(botToken, {
        polling: true,
        request: {
          url: telegramApiUrl,
          agentOptions: {
            keepAlive: true,
            family: 4,
          },
        },
      });
      this.isReady = true;

      const botProfile = await this.bot.getMe();
      this.logger.log(`✅ Telegram bot initialized successfully: ${botProfile.username}`);
    } catch (error) {
      this.logger.error('Failed to initialize Telegram bot:', error);
      this.isReady = false;
    }
  }

  /**
   * Check bot health and attempt reconnection if needed
   */
  async checkBotHealth(): Promise<boolean> {
    if (!this.bot) {
      this.logger.warn('Bot instance not available');
      return false;
    }

    try {
      await this.bot.getMe();
      if (!this.isReady) {
        this.isReady = true;
        this.logger.log('Bot health check passed - marking as ready');
      }
      return true;
    } catch (error) {
      this.logger.warn('Bot health check failed:', error.message);
      this.isReady = false;

      // Attempt to reinitialize if we haven't exceeded max attempts
      if (this.initializationAttempts < this.maxInitializationAttempts) {
        this.logger.log('Attempting to reinitialize bot due to health check failure...');
        setTimeout(() => this.initializeBot(), 5000);
      }

      return false;
    }
  }

  /**
   * Verify if a user has joined the Telegram channel/group
   * @param telegramUserId - The Telegram user ID to check
   * @param chatId - The Telegram channel/group ID to check membership in
   * @returns Promise<TelegramVerificationResult>
   */
  async verifyMembership(telegramUserId: number): Promise<TelegramVerificationResult> {
    // Check bot health first
    if (!this.isReady || !this.bot) {
      // Try to check health and wait a moment
      const isHealthy = await this.checkBotHealth();
      if (!isHealthy) {
        return {
          isVerified: false,
          error: 'Telegram bot not ready or unavailable',
        };
      }
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

      this.logger.debug(`Verifying membership for user ${telegramUserId} in chat ${targetChatId}`);

      // Get chat member info with timeout
      const memberPromise = this.bot.getChatMember(targetChatId, telegramUserId);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 10000);
      });

      const chatMember = (await Promise.race([memberPromise, timeoutPromise])) as any;

      // Check if user is a member (not left, kicked, or restricted)
      const validStatuses = ['creator', 'administrator', 'member'];
      const isVerified = validStatuses.includes(chatMember.status);

      this.logger.debug(`User ${telegramUserId} membership status: ${chatMember.status}, verified: ${isVerified}`);

      return {
        isVerified,
        memberSince:
          chatMember.status === 'member' && 'until_date' in chatMember
            ? new Date(chatMember.until_date * 1000)
            : undefined,
      };
    } catch (error) {
      this.logger.error(`Error verifying Telegram membership for user ${telegramUserId}:`, {
        message: error.message,
        code: error.code,
        description: error.description,
      });

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

      if (error.code === 403) {
        return {
          isVerified: false,
          error: 'Bot does not have permission to access this chat',
        };
      }

      if (error.message === 'Request timeout') {
        return {
          isVerified: false,
          error: 'Request timed out - please try again',
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
      const isHealthy = await this.checkBotHealth();
      if (!isHealthy) {
        return false;
      }
    }

    try {
      const chatPromise = this.bot.getChat(chatId);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 10000);
      });

      const chat = (await Promise.race([chatPromise, timeoutPromise])) as any;
      this.logger.log(`✅ Bot has access to chat: ${chat.title || chat.id}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Bot cannot access chat ${chatId}:`, {
        message: error.message,
        code: error.code,
        description: error.description,
      });
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
      const isHealthy = await this.checkBotHealth();
      if (!isHealthy) {
        return null;
      }
    }

    try {
      const chatPromise = this.bot.getChat(chatId);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 10000);
      });

      const chat = await Promise.race([chatPromise, timeoutPromise]);
      return chat;
    } catch (error) {
      this.logger.error(`Error getting chat info for ${chatId}:`, {
        message: error.message,
        code: error.code,
        description: error.description,
      });
      return null;
    }
  }

  /**
   * Check if the Telegram bot is ready
   */
  isBotReady(): boolean {
    return this.isReady && !!this.bot;
  }

  /**
   * Get bot status information for debugging
   */
  getBotStatus(): {
    isReady: boolean;
    hasBot: boolean;
    initializationAttempts: number;
    maxAttempts: number;
  } {
    return {
      isReady: this.isReady,
      hasBot: !!this.bot,
      initializationAttempts: this.initializationAttempts,
      maxAttempts: this.maxInitializationAttempts,
    };
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
