import { HttpModule } from "@nestjs/axios";
import { CoingeckoService } from "external/coingecko/coingecko.service";
import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Module({
    imports: [HttpModule.registerAsync({
        useFactory: (configService: ConfigService) => ({
            baseURL: configService.get('COINGECKO_API_URL'),
            headers: {
                'x-cg-demo-api-key': configService.get('COINGECKO_API_KEY'),
            },
        }),
        inject: [ConfigService],
    })],
    providers: [CoingeckoService],
    exports: [CoingeckoService],
})
export class CoingeckoModule { }
