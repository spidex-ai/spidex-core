import { SwapTransactionRepository } from "@database/repositories/swap-transaction.repository";
import { SwapController } from "@modules/swap/swap.controller";
import { SwapService } from "@modules/swap/swap.service";
import { SystemConfigModule } from "@modules/system-config/system-config.module";
import { TokenMetaModule } from "@modules/token-metadata/token-meta.module";
import { TokenPriceModule } from "@modules/token-price/token-price.module";
import { UserPointModule } from "@modules/user-point/user-point.module";
import { QuestModule } from "@modules/user-quest/quest.module";
import { Module, forwardRef } from "@nestjs/common";
import { BlockfrostModule } from "external/blockfrost/blockfrost.module";
import { DexhunterModule } from "external/dexhunter/dexhunter.module";
import { DHAPIModule } from "external/dhapi/dhapi.module";
import { TaptoolsModule } from "external/taptools/taptools.module";
import { CustomRepositoryModule } from "nestjs-typeorm-custom-repository";

@Module({
    imports: [
        CustomRepositoryModule.forFeature([SwapTransactionRepository]),
        DexhunterModule,
        BlockfrostModule,
        SystemConfigModule,
        TokenPriceModule,
        TaptoolsModule,
        TokenMetaModule,
        DHAPIModule,
        forwardRef(() => UserPointModule),
        forwardRef(() => QuestModule),
    ],
    controllers: [SwapController],
    providers: [SwapService],
    exports: [SwapService],
})
export class SwapModule { }
