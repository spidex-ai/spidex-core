import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuthNonceRepository } from '@database/repositories/auth-nonce.repository';
import { AuthNonceEntity, EAuthNonceStatus } from '@database/entities/auth-nonce.entity';
import { EEnvKey } from '@constants/env.constant';
import { EError } from '@constants/error.constant';
import { BadRequestException } from '@shared/exception/exception.resolver';
import { randomBytes } from 'crypto';

export interface IGenerateNonceResult {
  nonce: string;
  challengeMessage: string;
  expiresAt: Date;
}

export interface IValidateNonceResult {
  isValid: boolean;
  challengeMessage?: string;
  error?: string;
}

@Injectable()
export class AuthNonceService {
  private readonly logger = new Logger(AuthNonceService.name);
  private readonly nonceExpirationMinutes: number;

  constructor(
    private readonly authNonceRepository: AuthNonceRepository,
    private readonly configService: ConfigService,
  ) {
    this.nonceExpirationMinutes = this.configService.get<number>(EEnvKey.AUTH_NONCE_EXPIRATION_MINUTES) || 15;
  }

  async generateNonce(walletAddress: string): Promise<IGenerateNonceResult> {
    try {
      // Invalidate any existing active nonces for this wallet to prevent accumulation
      await this.authNonceRepository.invalidateWalletNonces(walletAddress);

      // Generate a cryptographically secure random nonce
      const nonce = this.generateSecureNonce();

      // Create expiration time
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + this.nonceExpirationMinutes);

      // Create challenge message with timestamp and nonce
      const timestamp = Date.now();
      const challengeMessage = `Spidex Authentication - Wallet: ${walletAddress} - Nonce: ${nonce} - Timestamp: ${timestamp} - Expires: ${expiresAt.toISOString()}`;

      // Save nonce to database
      const authNonce = new AuthNonceEntity();
      authNonce.nonce = nonce;
      authNonce.walletAddress = walletAddress;
      authNonce.status = EAuthNonceStatus.ACTIVE;
      authNonce.expiresAt = expiresAt;
      authNonce.challengeMessage = challengeMessage;

      await this.authNonceRepository.save(authNonce);

      this.logger.log(`Generated nonce for wallet ${walletAddress}, expires at ${expiresAt.toISOString()}`);

      return {
        nonce,
        challengeMessage,
        expiresAt,
      };
    } catch (error) {
      this.logger.error(`Failed to generate nonce for wallet ${walletAddress}:`, error);
      throw new BadRequestException({
        validatorErrors: EError.NONCE_GENERATION_FAILED,
        message: 'Failed to generate authentication nonce',
      });
    }
  }

  async validateAndConsumeNonce(nonce: string, walletAddress: string): Promise<IValidateNonceResult> {
    try {
      // Mark expired nonces first
      await this.authNonceRepository.markExpiredNonces();

      // Find the active nonce
      const authNonce = await this.authNonceRepository.findActiveNonceByValue(nonce);

      if (!authNonce) {
        return {
          isValid: false,
          error: 'Invalid or expired nonce',
        };
      }

      // Verify wallet address matches
      if (authNonce.walletAddress !== walletAddress) {
        return {
          isValid: false,
          error: 'Nonce does not match wallet address',
        };
      }

      // Check if nonce is expired
      if (authNonce.expiresAt < new Date()) {
        await this.authNonceRepository.markNonceAsUsed(nonce);
        return {
          isValid: false,
          error: 'Nonce has expired',
        };
      }

      // Mark nonce as used (consume it)
      await this.authNonceRepository.markNonceAsUsed(nonce);

      this.logger.log(`Successfully validated and consumed nonce for wallet ${walletAddress}`);

      return {
        isValid: true,
        challengeMessage: authNonce.challengeMessage,
      };
    } catch (error) {
      this.logger.error(`Failed to validate nonce for wallet ${walletAddress}:`, error);
      return {
        isValid: false,
        error: 'Nonce validation failed',
      };
    }
  }

  private generateSecureNonce(): string {
    // Generate 32 bytes of random data and convert to hex
    return randomBytes(32).toString('hex');
  }

  // Cleanup expired nonces every hour
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredNonces(): Promise<void> {
    try {
      this.logger.log('Starting cleanup of expired nonces...');

      // Mark expired nonces
      await this.authNonceRepository.markExpiredNonces();

      // Delete old expired nonces (older than 7 days)
      await this.authNonceRepository.cleanupExpiredNonces(7);

      this.logger.log('Completed cleanup of expired nonces');
    } catch (error) {
      this.logger.error('Failed to cleanup expired nonces:', error);
    }
  }
}
