import { SwapTransactionRepository } from "@database/repositories/swap-transaction.repository";
import { SwapController } from "@modules/swap/swap.controller";
import { SwapService } from "@modules/swap/swap.service";
import { Module } from "@nestjs/common";
import { BlockfrostModule } from "external/blockfrost/blockfrost.module";
import { DexhunterModule } from "external/dexhunter/dexhunter.module";
import { CustomRepositoryModule } from "nestjs-typeorm-custom-repository";

@Module({
    imports: [
        CustomRepositoryModule.forFeature([SwapTransactionRepository]),
        DexhunterModule,
        BlockfrostModule,
        
    ],
    controllers: [SwapController],
    providers: [SwapService],
    exports: [SwapService],
})
export class SwapModule { }
