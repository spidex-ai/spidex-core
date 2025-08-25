import { FavouriteTokenRepository } from '@database/repositories/favourite-token.repository';
import { TokenMetaModule } from '@modules/token-metadata/token-meta.module';
import { Module } from '@nestjs/common';
import { CustomRepositoryModule } from 'nestjs-typeorm-custom-repository';
import { FavouriteTokenController } from './favourite-token.controller';
import { FavouriteTokenService } from './favourite-token.service';

@Module({
  imports: [CustomRepositoryModule.forFeature([FavouriteTokenRepository]), TokenMetaModule],
  controllers: [FavouriteTokenController],
  providers: [FavouriteTokenService],
  exports: [FavouriteTokenService],
})
export class FavouriteTokenModule {}
