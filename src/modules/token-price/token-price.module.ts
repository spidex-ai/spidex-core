import { TokenPriceService } from '@modules/token-price/token-price.service';
import { Module } from '@nestjs/common';
import { CoingeckoModule } from 'external/coingecko/coingecko.module';
import { MinswapModule } from 'external/minswap/minswap.module';
import { TaptoolsModule } from 'external/taptools/taptools.module';

@Module({
  imports: [CoingeckoModule, TaptoolsModule, MinswapModule],
  providers: [TokenPriceService],
  exports: [TokenPriceService],
})
export class TokenPriceModule {}
