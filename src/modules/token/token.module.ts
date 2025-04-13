import { SwapModule } from "@modules/swap/swap.module";
import { TokenMetaModule } from "@modules/token-metadata/token-meta.module";
import { TokenPriceModule } from "@modules/token-price/token-price.module";
import { TokenController } from "@modules/token/token.controller";
import { TokenService } from "@modules/token/token.service";
import { Module } from "@nestjs/common";
import { BlockfrostModule } from "external/blockfrost/blockfrost.module";
import { TaptoolsModule } from "external/taptools/taptools.module";

@Module({
    imports: [TaptoolsModule, TokenPriceModule, TokenMetaModule, SwapModule, BlockfrostModule],
    providers: [TokenService],
    exports: [TokenService],
    controllers: [TokenController],
})
export class TokenModule { }