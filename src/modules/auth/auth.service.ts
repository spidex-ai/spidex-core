import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { EEnvKey } from '@constants/env.constant';
import { EError } from '@constants/error.constant';
import { EUserStatus } from '@constants/user.constant';
import { UserService } from '@modules/user/user.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, Unauthorized } from '@shared/exception/exception.resolver';
import { IJwtPayload } from '@shared/interfaces/auth.interface';
import {
  ConnectDiscordRequestDto,
  ConnectGoogleRequestDto,
  ConnectTelegramRequestDto,
  ConnectWalletRequestDto,
  ConnectXRequestDto,
  RefreshTokenRequestDto,
} from './dtos/auth-request.dto';

import verifyDataSignature from '@cardano-foundation/cardano-verify-datasignature';
import { AuthResponseOutputDto, GenerateNonceResponseDto } from '@modules/auth/dtos/auth-response.dto';
import { DiscordOAuthService } from 'external/discord/oauth/discord-oauth.service';
import { FirebaseAuthervice } from 'external/firebase/firebase-auth.service';
import { TelegramOAuthService } from 'external/telegram/oauth/telegram-oauth.service';
import { XApiHttpService } from 'external/x/x-api.service';
import { firstValueFrom } from 'rxjs';
import { AuthNonceService } from './auth-nonce.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UserService,
    private readonly configService: ConfigService,
    private readonly xClient: XApiHttpService,
    private readonly firebaseAuthService: FirebaseAuthervice,
    private readonly discordOAuthService: DiscordOAuthService,
    private readonly telegramOAuthService: TelegramOAuthService,
    private readonly authNonceService: AuthNonceService,
  ) {}

  async generateWalletNonce(walletAddress: string): Promise<GenerateNonceResponseDto> {
    const result = await this.authNonceService.generateNonce(walletAddress);
    return {
      nonce: result.nonce,
      challengeMessage: result.challengeMessage,
      expiresAt: result.expiresAt.toISOString(),
    };
  }

  getDiscordAuthUrl(redirectUri: string, state?: string) {
    const authUrl = this.discordOAuthService.generateAuthUrl(redirectUri, state);
    return { authUrl };
  }

  getTelegramWidgetConfig() {
    return this.telegramOAuthService.getLoginWidgetConfig();
  }

  async me(userId: number) {
    return this.usersService.getUserById(userId);
  }

  async connectWallet(connectWalletInput: ConnectWalletRequestDto, userId?: number): Promise<AuthResponseOutputDto> {
    const { referralCode, nonce } = connectWalletInput;

    // Validate and consume the nonce
    const nonceValidation = await this.authNonceService.validateAndConsumeNonce(nonce, connectWalletInput.address);
    if (!nonceValidation.isValid) {
      throw new Unauthorized({
        validatorErrors: EError.INVALID_NONCE,
        message: `AuthService::connectWallet() | Invalid nonce: ${nonceValidation.error}`,
      });
    }

    // Verify signature against the challenge message
    const verify = await this.verifySignatureWithMessage(
      connectWalletInput.publicKey,
      connectWalletInput.signature,
      connectWalletInput.address,
      nonceValidation.challengeMessage,
    );
    if (!verify) {
      throw new Unauthorized({
        validatorErrors: EError.UNAUTHORIZED,
        message: `AuthService::connectWallet() | Cannot connect: Invalid signature`,
      });
    }

    const user = await this.usersService.connectWallet({ ...connectWalletInput, referralCode }, userId);
    const payload = { walletAddress: connectWalletInput.address, userId: user.id };
    const { accessToken, refreshToken } = await this.getTokens(payload);

    return {
      accessToken: accessToken,
      refreshToken: refreshToken,
      userId: user.id,
    };
  }

  async refreshToken(data: RefreshTokenRequestDto) {
    const { refreshToken } = data;
    const decodedData: IJwtPayload = await this.jwtService.verifyAsync(refreshToken, {
      secret: this.configService.get(EEnvKey.JWT_REFRESH_TOKEN_SECRET),
    });

    const user = await this.usersService.getUserById(decodedData.userId, false);

    if (!user || user.status !== EUserStatus.ACTIVE) {
      throw new Unauthorized({
        validatorErrors: EError.USER_NOT_EXIST,
        message: `User not found or not active`,
      });
    }

    const payload = { walletAddress: user.walletAddress, userId: user.id };

    return this.getTokens(payload);
  }

  private async getTokens(payload: IJwtPayload) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        expiresIn: this.configService.get(EEnvKey.JWT_REFRESH_TOKEN_EXPIRATION_TIME),
        secret: this.configService.get(EEnvKey.JWT_REFRESH_TOKEN_SECRET),
      }),
    ]);
    return {
      accessToken,
      refreshToken,
    };
  }

  verifySignatureWithMessage = async (publicKey: string, signature: string, walletAddress: string, message: string) => {
    try {
      const verify = verifyDataSignature(signature, publicKey, message, walletAddress);

      if (!verify) {
        throw new BadRequestException({
          validatorErrors: EError.VERIFY_SIGNATURE_FAILED,
          message: `AuthService::verifySignatureWithMessage() | Failed to verify signature`,
        });
      }

      return true;
    } catch (error) {
      throw new BadRequestException({
        validatorErrors: EError.VERIFY_SIGNATURE_FAILED,
        message: `AuthService::verifySignatureWithMessage() | Failed to verify signature: ${error}`,
      });
    }
  };

  async connectX(body: ConnectXRequestDto, userId?: number): Promise<AuthResponseOutputDto> {
    const { code, redirectUri, referralCode } = body;

    const clientId = this.configService.get(EEnvKey.X_CLIENT_ID);
    const clientSecret = this.configService.get(EEnvKey.X_CLIENT_SECRET);

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const tokenResponse = await firstValueFrom(
      this.xClient.post(
        '/oauth2/token',
        new URLSearchParams({
          client_id: clientId,
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          code_verifier: 'challenge',
        }),
        {
          headers: {
            Authorization: `Basic ${basicAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      ),
    ).catch(err => {
      throw new BadRequestException({
        validatorErrors: EError.ERROR_NOT_CONNECT_TWITTER,
        message: `AuthService::connectX() | Failed to connect X account: ${err}`,
      });
    });

    const { access_token: xAccessToken } = tokenResponse.data;
    const userResponse = await firstValueFrom(
      this.xClient.get('/users/me', {
        headers: { Authorization: `Bearer ${xAccessToken}`, 'Content-Type': 'application/json' },
      }),
    );

    const data = userResponse?.data?.data;
    const { id, username } = data;

    if (!id || !username) {
      throw new BadRequestException({
        validatorErrors: EError.ERROR_NOT_CONNECT_TWITTER,
        message: `AuthService::connectX() | Failed to connect X account: ${userResponse}`,
      });
    }

    const user = await this.usersService.connectX({ id, username, referralCode }, userId);

    const payload = { userId: user.id };
    const { accessToken, refreshToken } = await this.getTokens(payload);

    return {
      accessToken: accessToken,
      refreshToken: refreshToken,
      userId: user.id,
    };
  }

  async connectGoogle(body: ConnectGoogleRequestDto, userId?: number): Promise<AuthResponseOutputDto> {
    const { idToken, referralCode } = body;

    const { email, email_verified: emailVerified } = await this.firebaseAuthService.verifyIdToken(idToken);

    if (!emailVerified) {
      throw new BadRequestException({
        validatorErrors: EError.USER_EMAIL_NOT_VERIFIED,
        message: `AuthService::connectGoogle() | User email not verified`,
      });
    }

    const user = await this.usersService.connectGoogle({ email, referralCode }, userId);

    const payload = { userId: user.id };
    const { accessToken, refreshToken } = await this.getTokens(payload);

    return {
      accessToken: accessToken,
      refreshToken: refreshToken,
      userId: user.id,
    };
  }

  async connectDiscord(body: ConnectDiscordRequestDto, userId?: number): Promise<AuthResponseOutputDto> {
    const { code, redirectUri, referralCode } = body;

    // Verify Discord OAuth2 and get user information
    const discordVerification = await this.discordOAuthService.verifyDiscordUser(code, redirectUri);

    const { user: discordUser } = discordVerification;

    // Connect Discord account to user
    const user = await this.usersService.connectDiscord(
      {
        id: discordUser.id,
        username: discordUser.username,
        referralCode,
      },
      userId,
    );

    const payload = { userId: user.id };
    const { accessToken, refreshToken } = await this.getTokens(payload);

    return {
      accessToken: accessToken,
      refreshToken: refreshToken,
      userId: user.id,
    };
  }

  async connectTelegram(body: ConnectTelegramRequestDto, userId?: number): Promise<AuthResponseOutputDto> {
    // Verify Telegram Login Widget data
    const telegramUser = this.telegramOAuthService.verifyTelegramAuth(body);

    // Connect Telegram account to user
    const user = await this.usersService.connectTelegram(
      {
        id: telegramUser.id.toString(),
        username:
          telegramUser.username ||
          `${telegramUser.firstName}${telegramUser.lastName ? '_' + telegramUser.lastName : ''}`,
        referralCode: body.referralCode,
      },
      userId,
    );

    const payload = { userId: user.id };
    const { accessToken, refreshToken } = await this.getTokens(payload);

    return {
      accessToken: accessToken,
      refreshToken: refreshToken,
      userId: user.id,
    };
  }
}
