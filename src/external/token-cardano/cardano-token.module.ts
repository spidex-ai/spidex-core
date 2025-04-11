import { Module } from "@nestjs/common";
import { TokenCardanoService } from "./cardano-token.service";
import { HttpModule } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";

@Module({
    imports: [HttpModule.registerAsync({
        useFactory: (configService: ConfigService) => ({
            baseURL: configService.get('TOKEN_CARDANO_API_URL'),
        }),
        inject: [ConfigService],
    })],
    providers: [TokenCardanoService],
    exports: [TokenCardanoService],
})
export class TokenCardanoModule { }
