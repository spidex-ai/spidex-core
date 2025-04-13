import { TokenMetadataRepository } from "@database/repositories/token-metadata.repository";
import { TokenMetaService } from "@modules/token-metadata/token-meta.service";
import { Module } from "@nestjs/common";
import { AwsModule } from "external/aws/aws.module";
import { TokenCardanoModule } from "external/token-cardano/cardano-token.module";
import { CustomRepositoryModule } from "nestjs-typeorm-custom-repository";

@Module({
    imports: [
        CustomRepositoryModule.forFeature([TokenMetadataRepository]),
        AwsModule,
        TokenCardanoModule,
    ],
    providers: [TokenMetaService],
    exports: [TokenMetaService],
})
export class TokenMetaModule { }