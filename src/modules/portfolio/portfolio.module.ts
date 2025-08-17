import { PortfolioController } from '@modules/portfolio/portfolio.controller';
import { PortfolioService } from '@modules/portfolio/portfolio.service';
import { TokenMetaModule } from '@modules/token-metadata/token-meta.module';
import { TokenPriceModule } from '@modules/token-price/token-price.module';
import { UserModule } from '@modules/user/user.module';
import { Module } from '@nestjs/common';
import { BlockfrostModule } from 'external/blockfrost/blockfrost.module';
import { TaptoolsModule } from 'external/taptools/taptools.module';

@Module({
  imports: [BlockfrostModule, TokenPriceModule, TaptoolsModule, TokenMetaModule, UserModule],
  controllers: [PortfolioController],
  providers: [PortfolioService],
})
export class PortfolioModule {}
