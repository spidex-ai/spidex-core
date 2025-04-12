import { SwapModule } from "@modules/swap/swap.module";
import { TokenPriceModule } from "@modules/token-price/token-price.module";
import { TokenController } from "@modules/token/token.controller";
import { TokenService } from "@modules/token/token.service";
import { Module } from "@nestjs/common";
import { BlockfrostModule } from "external/blockfrost/blockfrost.module";
import { TaptoolsModule } from "external/taptools/taptools.module";
import { TokenCardanoModule } from "external/token-cardano/cardano-token.module";

@Module({
    imports: [TaptoolsModule, TokenPriceModule, TokenCardanoModule, SwapModule, BlockfrostModule],
    providers: [TokenService],
    exports: [TokenService],
    controllers: [TokenController],
})
export class TokenModule { }