import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, createHmac } from 'crypto';
import { BadRequestException } from '@shared/exception/exception.resolver';
import { EError } from '@constants/error.constant';

export interface TelegramAuthData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export interface TelegramUser {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
  authDate: number;
}

@Injectable()
export class TelegramOAuthService {
  private readonly logger = new Logger(TelegramOAuthService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Verify Telegram Login Widget data
   * This validates that the data actually came from Telegram
   */
  verifyTelegramAuth(authData: TelegramAuthData): TelegramUser {
    this.logger.debug('Verifying Telegram auth data:', JSON.stringify(authData, null, 2));

    const botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');

    if (!botToken) {
      this.logger.error('Telegram bot token not configured');
      throw new BadRequestException({
        validatorErrors: EError.TELEGRAM_CONFIG_MISSING,
        message: 'Telegram bot token not configured',
      });
    }

    // Check if auth data is not too old (default: 24 hours)
    const maxAge = this.configService.get<number>('TELEGRAM_AUTH_MAX_AGE', 86400); // 24 hours in seconds
    const currentTime = Math.floor(Date.now() / 1000);
    const timeDiff = currentTime - authData.auth_date;

    this.logger.debug(
      `Auth time check: current=${currentTime}, auth_date=${authData.auth_date}, diff=${timeDiff}, maxAge=${maxAge}`,
    );

    if (timeDiff > maxAge) {
      this.logger.error(`Telegram auth data too old: ${timeDiff} seconds > ${maxAge} seconds`);
      throw new BadRequestException({
        validatorErrors: EError.TELEGRAM_AUTH_EXPIRED,
        message: 'Telegram authentication data is too old',
      });
    }

    // Verify the hash
    if (!this.verifyHash(authData, botToken)) {
      this.logger.error('Telegram hash verification failed');
      throw new BadRequestException({
        validatorErrors: EError.TELEGRAM_AUTH_INVALID,
        message: 'Invalid Telegram authentication data',
      });
    }

    this.logger.debug('Telegram auth verification successful');

    return {
      id: authData.id,
      firstName: authData.first_name,
      lastName: authData.last_name,
      username: authData.username,
      photoUrl: authData.photo_url,
      authDate: authData.auth_date,
    };
  }

  /**
   * Verify the hash according to Telegram's algorithm
   * https://core.telegram.org/widgets/login#checking-authorization
   */
  private verifyHash(authData: TelegramAuthData, botToken: string): boolean {
    const { hash, ...dataWithoutHash } = authData;

    // Remove any non-Telegram fields that shouldn't be included in hash verification
    // Only include fields that are part of Telegram's official auth data
    const telegramFields = ['id', 'first_name', 'last_name', 'username', 'photo_url', 'auth_date'];
    const filteredData = {};

    for (const key of telegramFields) {
      if (dataWithoutHash[key] !== undefined && dataWithoutHash[key] !== null) {
        filteredData[key] = dataWithoutHash[key];
      }
    }

    // Create data check string
    const dataCheckString = Object.keys(filteredData)
      .sort()
      .map(key => `${key}=${filteredData[key]}`)
      .join('\n');

    this.logger.debug('Data check string:', dataCheckString);

    // Create secret key
    const secretKey = createHash('sha256').update(botToken).digest();

    // Create hash
    const calculatedHash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    this.logger.debug('Calculated hash:', calculatedHash);
    this.logger.debug('Provided hash:', hash);

    return calculatedHash === hash;
  }

  /**
   * Generate Telegram Login Widget URL
   */
  generateLoginWidgetUrl(redirectUrl: string, requestAccess?: boolean): string {
    const botUsername = this.configService.get<string>('TELEGRAM_BOT_USERNAME');

    if (!botUsername) {
      throw new BadRequestException({
        validatorErrors: EError.TELEGRAM_CONFIG_MISSING,
        message: 'Telegram bot username not configured',
      });
    }

    const params = new URLSearchParams({
      bot_id: botUsername,
      origin: redirectUrl,
      return_to: redirectUrl,
    });

    if (requestAccess) {
      params.append('request_access', 'write');
    }

    return `https://oauth.telegram.org/auth?${params.toString()}`;
  }

  /**
   * Generate Telegram Login Widget script for frontend
   */
  generateLoginWidgetScript(options: {
    botUsername: string;
    buttonSize?: 'large' | 'medium' | 'small';
    cornerRadius?: number;
    requestAccess?: boolean;
    userpic?: boolean;
    onAuth?: string; // JavaScript callback function name
  }): string {
    const {
      botUsername,
      buttonSize = 'large',
      cornerRadius = 10,
      requestAccess = false,
      userpic = true,
      onAuth = 'onTelegramAuth',
    } = options;

    return `
      <script async src="https://telegram.org/js/telegram-widget.js?22"
        data-telegram-login="${botUsername}"
        data-size="${buttonSize}"
        data-radius="${cornerRadius}"
        data-onauth="${onAuth}(user)"
        ${requestAccess ? 'data-request-access="write"' : ''}
        ${!userpic ? 'data-userpic="false"' : ''}
      ></script>
    `;
  }

  /**
   * Validate Telegram user data format
   */
  validateTelegramAuthData(data: any): TelegramAuthData {
    if (!data || typeof data !== 'object') {
      throw new BadRequestException({
        validatorErrors: EError.TELEGRAM_AUTH_INVALID,
        message: 'Invalid Telegram auth data format',
      });
    }

    const requiredFields = ['id', 'first_name', 'auth_date', 'hash'];
    for (const field of requiredFields) {
      if (!(field in data)) {
        throw new BadRequestException({
          validatorErrors: EError.TELEGRAM_AUTH_INVALID,
          message: `Missing required field: ${field}`,
        });
      }
    }

    // Validate data types
    if (typeof data.id !== 'number' || data.id <= 0) {
      throw new BadRequestException({
        validatorErrors: EError.TELEGRAM_AUTH_INVALID,
        message: 'Invalid Telegram user ID',
      });
    }

    if (typeof data.first_name !== 'string' || data.first_name.trim() === '') {
      throw new BadRequestException({
        validatorErrors: EError.TELEGRAM_AUTH_INVALID,
        message: 'Invalid first name',
      });
    }

    if (typeof data.auth_date !== 'number' || data.auth_date <= 0) {
      throw new BadRequestException({
        validatorErrors: EError.TELEGRAM_AUTH_INVALID,
        message: 'Invalid auth date',
      });
    }

    if (typeof data.hash !== 'string' || data.hash.length !== 64) {
      throw new BadRequestException({
        validatorErrors: EError.TELEGRAM_AUTH_INVALID,
        message: 'Invalid hash',
      });
    }

    return {
      id: data.id,
      first_name: data.first_name,
      last_name: data.last_name || undefined,
      username: data.username || undefined,
      photo_url: data.photo_url || undefined,
      auth_date: data.auth_date,
      hash: data.hash,
    };
  }

  /**
   * Get Telegram Login Widget configuration for frontend
   */
  getLoginWidgetConfig() {
    const botUsername = this.configService.get<string>('TELEGRAM_BOT_USERNAME');

    if (!botUsername) {
      throw new BadRequestException({
        validatorErrors: EError.TELEGRAM_CONFIG_MISSING,
        message: 'Telegram bot username not configured',
      });
    }

    return {
      botUsername,
      scriptUrl: 'https://telegram.org/js/telegram-widget.js?22',
    };
  }
}
