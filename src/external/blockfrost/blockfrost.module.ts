import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { BlockfrostService } from "external/blockfrost/blockfrost.service";

@Module({
    imports: [HttpModule.registerAsync({
        useFactory: (configService: ConfigService) => ({
            baseURL: configService.get<string>('BLOCKFROST_API_URL'),
            headers: {
                'Project_id': configService.get<string>('BLOCKFROST_API_KEY')
            }
        }),
        inject: [ConfigService],
    })],
    providers: [BlockfrostService],
    exports: [BlockfrostService],
})
export class BlockfrostModule { } 