import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { EEnvKey } from '@constants/env.constant';
import { IJwtPayload } from '@shared/interfaces/auth.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(public readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get(EEnvKey.JWT_ACCESS_TOKEN_SECRET),
    });
  }

  async validate(payload: IJwtPayload) {
    return payload;
  }
}
