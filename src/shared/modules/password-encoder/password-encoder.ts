import { EEnvKey } from '@constants/env.constant';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

@Injectable()
export class PasswordEncoder {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Hashes the password using bcrypt
   *
   * @param password {string} - The password to hash
   *
   * @returns {Promise<string>} - The hashed password
   */
  async hashPassword(password: string): Promise<string> {
    const pepper = this.configService.get<string>(EEnvKey.AUTH_PEPPER, 'secretpepper');
    const saltRounds = Number(this.configService.get<number>(EEnvKey.AUTH_SALT_ROUNDS, 10));

    const salt = await bcrypt.genSalt(saltRounds);
    const hmac = crypto.createHmac('sha256', pepper);
    hmac.update(password);

    return bcrypt.hash(hmac.digest('hex'), salt);
  }

  /**
   * Compares the password with the hashed password
   *
   * @param password {string} - The password to compare
   * @param hashedPassword {string} - The hashed password to compare
   *
   * @returns {Promise<boolean>} - True if the password matches the hashed password, false otherwise
   */
  comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    const pepper = this.configService.get<string>(EEnvKey.AUTH_PEPPER, 'secretpepper');
    const hmac = crypto.createHmac('sha256', pepper);
    hmac.update(password);
    const hashedInputPassword = hmac.digest('hex');

    return bcrypt.compare(hashedInputPassword, hashedPassword);
  }
}
