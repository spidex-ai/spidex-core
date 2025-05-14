import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DexhunterService } from "external/dexhunter/dexhunter.service";

@Module({
    imports: [HttpModule.registerAsync({
        useFactory: (configService: ConfigService) => ({
            baseURL: configService.get<string>('DEXHUNTER_API_URL'),
            headers: {
                'X-Partner-Id': configService.get<string>('DEXHUNTER_PARTNER_ID'),
            }
        }),
        inject: [ConfigService],
    })],
    providers: [DexhunterService],
    exports: [DexhunterService],
})
export class DexhunterModule { } 