import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import TelegramBot from 'node-telegram-bot-api';

export interface TelegramVerificationResult {
  isVerified: boolean;
  memberSince?: Date;
  error?: string;
}

@Injectable()
export class TelegramVerificationService implements OnModuleDestroy {
  private readonly logger = new Logger(TelegramVerificationService.name);
  private bot: TelegramBot;
  private isReady = false;
  private initializationAttempts = 0;
  private readonly maxInitializationAttempts = 3;
  private initializationTimeout: NodeJS.Timeout;

  constructor(private readonly configService: ConfigService) {
    // Check if this instance should handle Telegram polling
    const shouldInitialize = this.shouldInitializeTelegramBot();

    if (!shouldInitialize) {
      this.logger.warn('🚫 Telegram bot initialization skipped - another instance is handling it');
      return;
    }

    // In production, delay longer to avoid conflicts with multiple instances
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    const delay = isProduction ? 15000 : 2000; // 15 seconds in production

    this.logger.log(
      `📱 This instance will handle Telegram bot. Scheduling initialization in ${delay}ms (${isProduction ? 'production' : 'development'} mode)`,
    );

    this.initializationTimeout = setTimeout(() => {
      this.initializeBot();
    }, delay);
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
      const currentInstance = this.configService.get<string>('INSTANCE_NAME') || 'api';
      const shouldHandle = currentInstance === telegramHandler;

      this.logger.log(
        `🔍 Telegram handler check: current=${currentInstance}, expected=${telegramHandler}, shouldHandle=${shouldHandle}`,
      );
      return shouldHandle;
    }

    // Default behavior: only 'api' instance handles Telegram (not core-consumer)
    const currentInstance = this.configService.get<string>('INSTANCE_NAME') || 'api';
    const isApiInstance = currentInstance === 'api' || currentInstance.includes('api');

    this.logger.log(`🔍 Default Telegram handler logic: instance=${currentInstance}, isApiInstance=${isApiInstance}`);
    return isApiInstance;
  }

  async onModuleDestroy() {
    if (this.initializationTimeout) {
      clearTimeout(this.initializationTimeout);
    }
    await this.cleanup();
  }

  private async cleanup() {
    if (this.bot) {
      try {
        this.logger.log('Cleaning up Telegram bot...');
        await this.bot.stopPolling();
        this.bot.removeAllListeners();
        this.isReady = false;
        this.logger.log('Telegram bot cleanup completed');
      } catch (error) {
        this.logger.warn('Error during Telegram bot cleanup:', error.message);
      }
    }
  }

  private async initializeBot() {
    this.initializationAttempts++;

    try {
      const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
      if (!token) {
        this.logger.warn('TELEGRAM_BOT_TOKEN not configured. Telegram verification will be disabled.');
        return;
      }

      this.logger.log(
        `Initializing Telegram bot (attempt ${this.initializationAttempts}/${this.maxInitializationAttempts})...`,
      );

      // Clean up any existing bot instance
      await this.cleanup();

      // Create new bot instance with production-optimized configuration

      this.bot = new TelegramBot(token, {
        polling: true,
        request: {
          agentOptions: {
            keepAlive: true,
            family: 4,
          },
          url: 'https://api.telegram.org',
        },
      });

      // Set up error handlers before starting polling
      this.bot.on('error', error => {
        this.logger.error('Telegram bot error:', error);
        this.handleBotError(error);
      });

      this.bot.on('polling_error', error => {
        this.logger.error('Telegram bot polling error:', error);
        this.handlePollingError(error);
      });

      // Start polling manually
      await this.bot.startPolling();

      // Test the bot connection with timeout
      const connectionPromise = this.bot.getMe();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout')), 15000);
      });

      const me = (await Promise.race([connectionPromise, timeoutPromise])) as any;

      this.isReady = true;
      this.initializationAttempts = 0; // Reset on success
      this.logger.log(`✅ Telegram bot initialized successfully: @${me.username} (${me.first_name})`);
    } catch (error) {
      this.isReady = false;

      // Enhanced error logging for EC2 debugging
      const errorDetails = {
        message: error.message,
        code: error.code,
        type: error.constructor.name,
        stack: error.stack?.split('\n')[0], // First line of stack trace
        attempt: this.initializationAttempts,
        maxAttempts: this.maxInitializationAttempts,
      };

      this.logger.error(`❌ Failed to initialize Telegram bot:`, errorDetails);

      // Check for specific EC2-related errors
      if (error.code === 'EFATAL' || error.message?.includes('EFATAL') || error.message?.includes('AggregateError')) {
        this.logger.error('🚨 EFATAL/AggregateError detected! Common causes in EC2:');
        this.logger.error('   1. Multiple instances polling the same bot token');
        this.logger.error('   2. Webhook conflicts with polling');
        this.logger.error('   3. Network connectivity issues to api.telegram.org');
        this.logger.error('   4. EC2 security group blocking outbound HTTPS (port 443)');
        this.logger.error('   5. Rate limiting from Telegram servers');
      }

      if (error.code === 'ENOTFOUND' || error.message?.includes('getaddrinfo')) {
        this.logger.error('🌐 DNS resolution error detected! Check EC2 DNS settings and internet connectivity.');
      }

      if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
        this.logger.error('⏱️  Timeout error detected! Check EC2 network latency and security groups.');
      }

      // Retry logic with longer delays for EC2
      if (this.initializationAttempts < this.maxInitializationAttempts) {
        const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
        const baseDelay = isProduction ? 15000 : 5000; // Longer delays in production
        const retryDelay = this.initializationAttempts * baseDelay; // Exponential backoff

        this.logger.log(`Retrying Telegram bot initialization in ${retryDelay}ms...`);

        setTimeout(() => {
          this.initializeBot();
        }, retryDelay);
      } else {
        this.logger.error('❌ Max initialization attempts reached. Telegram verification will be disabled.');
        this.logger.error('💡 For EC2 troubleshooting, run: ./diagnose-telegram-ec2.sh');
      }
    }
  }

  private handleBotError(error: any) {
    this.logger.error('Telegram bot encountered an error:', error);
    this.isReady = false;

    // Attempt to restart the bot after a delay
    setTimeout(() => {
      if (this.initializationAttempts < this.maxInitializationAttempts) {
        this.logger.log('Attempting to restart Telegram bot after error...');
        this.initializeBot();
      }
    }, 10000);
  }

  private handlePollingError(error: any) {
    this.logger.error('Telegram bot polling error:', {
      message: error.message,
      code: error.code,
      type: error.constructor.name,
    });

    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';

    // Handle specific polling errors
    if (error.code === 'EFATAL' || error.message?.includes('EFATAL') || error.message?.includes('AggregateError')) {
      this.logger.error(
        '🚨 EFATAL/AggregateError detected! This usually indicates a conflict with another bot instance or network issues.',
      );
      this.isReady = false;

      // In production, be more aggressive about cleanup and restart
      const restartDelay = isProduction ? 30000 : 15000; // 30 seconds in production

      this.logger.log(`Scheduling bot restart in ${restartDelay}ms due to EFATAL error...`);

      setTimeout(async () => {
        try {
          await this.cleanup();

          // In production, reset attempt counter to allow more retries for critical errors
          if (isProduction && (error.code === 'EFATAL' || error.message?.includes('EFATAL'))) {
            this.initializationAttempts = 0;
            this.logger.log('Reset initialization attempts due to EFATAL error in production');
          }

          if (this.initializationAttempts < this.maxInitializationAttempts) {
            this.initializeBot();
          } else {
            this.logger.error(
              '❌ Max initialization attempts reached after EFATAL error. Manual intervention may be required.',
            );
          }
        } catch (cleanupError) {
          this.logger.error('Error during cleanup after EFATAL:', cleanupError);
        }
      }, restartDelay);
    } else {
      // Handle other polling errors with standard retry logic
      this.isReady = false;
      setTimeout(() => {
        if (this.initializationAttempts < this.maxInitializationAttempts) {
          this.logger.log('Attempting to restart bot after polling error...');
          this.initializeBot();
        }
      }, 10000);
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
