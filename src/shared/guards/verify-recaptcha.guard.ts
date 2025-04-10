import { EEnvKey } from '@constants/env.constant';
import { EError } from '@constants/error.constant';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@shared/exception';
import axios from 'axios';

@Injectable()
export class VerifyRecaptchaGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const body = request.body;
    const secretKey = this.configService.get<string>(EEnvKey.GOOGLE_RECAPCHA_SECRET_KEY);
    const verificationUrl = this.configService.get<string>(EEnvKey.VERIFICATION_URL);

    const verificationURL = `${verificationUrl}?secret=${secretKey}&response=${body.token}`;
    try {
      const response = await axios.post(verificationURL);
      const data = response.data;

      if (data.success) {
        return true;
      } else {
        throw new BadRequestException({
          validator_errors: EError.VERIFY_RECAPTCHA_FAIL,
        });
      }
    } catch (error) {
      console.error('Error verifying reCAPTCHA:', error.message);
      throw new BadRequestException({
        validator_errors: EError.VERIFY_RECAPTCHA_FAIL,
      });
    }
  }
}
