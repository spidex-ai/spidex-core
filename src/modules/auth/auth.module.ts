import { EEnvKey } from '@constants/env.constant';
import { UserModule } from '@modules/user/user.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '@shared/strategy/jwt.strategy';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';


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
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule { }
