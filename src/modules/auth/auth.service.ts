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
  ConnectGoogleRequestDto,
  ConnectWalletRequestDto,
  ConnectXRequestDto,
  RefreshTokenRequestDto
} from './dtos/auth-request.dto';

import verifyDataSignature from '@cardano-foundation/cardano-verify-datasignature';
import { AuthResponseOutputDto } from '@modules/auth/dtos/auth-response.dto';
import { FirebaseAuthervice } from 'external/firebase/firebase-auth.service';
import { XApiHttpService } from 'external/x/x-api.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UserService,
    private readonly configService: ConfigService,
    private readonly xClient: XApiHttpService,
    private readonly firebaseAuthService: FirebaseAuthervice,
  ) { }

  getConnectWalletSignMessage() {
    return this.configService.get<string>(EEnvKey.WALLET_SIGN_MESSAGE);
  }

  async me(userId: number) {
    return this.usersService.getUserById(userId);
  }

  async connectWallet(connectWalletInput: ConnectWalletRequestDto, userId?: number): Promise<AuthResponseOutputDto> {
    const { referralCode } = connectWalletInput;
    const verify = await this.verifySignature(
      connectWalletInput.publicKey,
      connectWalletInput.signature,
      connectWalletInput.address,
    );
    if (!verify) {
      throw new Unauthorized({
        validatorErrors: EError.UNAUTHORIZED,
        message: `AuthService::connectWallet() | Cannot connect: Invalid data`,
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

    const user = await this.usersService.getUserById(decodedData.userId);

    if (!user || user.status !== EUserStatus.ACTIVE) {
      throw new BadRequestException({
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

  verifySignature = async (publicKey: string, signature: string, walletAddress: string) => {
    try {
      const signMessage = process.env.WALLET_SIGN_MESSAGE;

      const verify = verifyDataSignature(signature, publicKey, signMessage, walletAddress);

      if (!verify) {
        throw new BadRequestException({
          validatorErrors: EError.VERIFY_SIGNATURE_FAILED,
          message: `AuthService::verifySignature() | Failed to verify signature`,
        });
      }

      return true;
    } catch (error) {
      throw new BadRequestException({
        validatorErrors: EError.VERIFY_SIGNATURE_FAILED,
        message: `AuthService::verifySignature() | Failed to verify signature: ${error}`,
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

}
