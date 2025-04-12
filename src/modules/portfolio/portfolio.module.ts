import { PortfolioController } from "@modules/portfolio/portfolio.controller";
import { PortfolioService } from "@modules/portfolio/portfolio.service";
import { TokenPriceModule } from "@modules/token-price/token-price.module";
import { Module } from "@nestjs/common";
import { BlockfrostModule } from "external/blockfrost/blockfrost.module";
import { TaptoolsModule } from "external/taptools/taptools.module";
import { TokenCardanoModule } from "external/token-cardano/cardano-token.module";

@Module({
    imports: [BlockfrostModule, TokenCardanoModule, TokenPriceModule, TaptoolsModule],
    controllers: [PortfolioController],
    providers: [PortfolioService],
})
export class PortfolioModule { }