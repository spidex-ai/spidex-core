import { TokenPriceModule } from "@modules/token-price/token-price.module";
import { TokenController } from "@modules/token/token.controller";
import { TokenService } from "@modules/token/token.service";
import { Module } from "@nestjs/common";
import { TaptoolsModule } from "external/taptools/taptools.module";
import { TokenCardanoModule } from "external/token-cardano/cardano-token.module";

@Module({
    imports: [TaptoolsModule, TokenPriceModule, TokenCardanoModule],
    providers: [TokenService],
    exports: [TokenService],
    controllers: [TokenController],
})
export class TokenModule { }