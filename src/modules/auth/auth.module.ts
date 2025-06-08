import { EEnvKey } from '@constants/env.constant';
import { UserModule } from '@modules/user/user.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '@shared/strategy/jwt.strategy';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { DiscordOAuthModule } from 'external/discord/oauth/discord-oauth.module';
import { FirebaseModule } from 'external/firebase/firebase.module';
import { TelegramOAuthModule } from 'external/telegram/oauth/telegram-oauth.module';
import { XApiModule } from 'external/x/x-api.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        ({
          secret: configService.get(EEnvKey.JWT_ACCESS_TOKEN_SECRET),
          signOptions: {
            expiresIn: configService.get(EEnvKey.JWT_ACCESS_TOKEN_EXPIRATION_TIME),
          },
        }) as JwtModuleOptions,
      inject: [ConfigService],
    }),
    UserModule,
    DiscordOAuthModule,
    TelegramOAuthModule,
    FirebaseModule,
    XApiModule,
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
