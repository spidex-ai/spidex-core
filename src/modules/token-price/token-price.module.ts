import { TokenPriceService } from "@modules/token-price/token-price.service";
import { Module } from "@nestjs/common";
import { CoingeckoModule } from "external/coingecko/coingecko.module";

@Module({
    imports: [CoingeckoModule],
    providers: [TokenPriceService],
    exports: [TokenPriceService],
})
export class TokenPriceModule { }