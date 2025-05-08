import { Module } from '@nestjs/common';
import { PasswordEncoder } from './password-encoder';

@Module({
  providers: [PasswordEncoder],
  exports: [PasswordEncoder],
})
export class PasswordEncoderModule {}
