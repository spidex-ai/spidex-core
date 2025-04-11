import { SwapController } from "@modules/swap/swap.controller";
import { SwapService } from "@modules/swap/swap.service";
import { Module } from "@nestjs/common";
import { DexhunterModule } from "external/dexhunter/dexhunter.module";

@Module({
    imports: [DexhunterModule],
    controllers: [SwapController],
    providers: [SwapService],
    exports: [SwapService],
})
export class SwapModule { }
