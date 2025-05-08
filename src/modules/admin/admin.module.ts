import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PasswordEncoderModule } from '@shared/modules/password-encoder/password-encoder.module';
import { AdminRepository } from '@database/repositories/admin.repository';
import { CustomRepositoryModule } from 'nestjs-typeorm-custom-repository';
import { ConfigService } from '@nestjs/config';
import { EEnvKey } from '@constants/env.constant';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    CustomRepositoryModule.forFeature([AdminRepository]),
    PasswordEncoderModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
          secret: configService.get(EEnvKey.JWT_ACCESS_TOKEN_SECRET),
          signOptions: {
              expiresIn: configService.get(EEnvKey.JWT_ACCESS_TOKEN_EXPIRATION_TIME),
          },
      }),
      inject: [ConfigService],
  }),
  ConfigModule,
  ],
  controllers: [AdminController],
  providers: [AdminService]
})
export class AdminModule {}
