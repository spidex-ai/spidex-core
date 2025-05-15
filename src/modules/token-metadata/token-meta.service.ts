import { TokenMetadataRepository } from "@database/repositories/token-metadata.repository";
import { Injectable } from "@nestjs/common";
import { S3Service } from "external/aws/s3/s3.service";
import { BlockfrostService } from "external/blockfrost/blockfrost.service";
import { TokenCardanoService } from "external/token-cardano/cardano-token.service";
import { pick } from "lodash";
import { In } from "typeorm";
@Injectable()
export class TokenMetaService {
    constructor(
        private readonly tokenMetadataRepository: TokenMetadataRepository,
        private readonly s3Service: S3Service,
        private readonly tokenCardanoService: TokenCardanoService,
        private readonly blockfrostService: BlockfrostService
    ) { }

    async getTokenMetadata(unit: string, properties: string[]) {
        const pickProperties = ['unit'].concat(properties);
        let tokenMetadata = await this.tokenMetadataRepository.findOne({ where: { unit } });
        if (!tokenMetadata) {
            const [token, blockfrostToken] = await Promise.all([this.tokenCardanoService.tokenInfo(unit), this.blockfrostService.getTokenDetail(unit)]);
            if (!token && !blockfrostToken) {
                return null;
            }

            let logo
            if (token.logo?.value) {
                logo = await this.uploadTokenLogo(token.subject, token.logo.value);
            }

            tokenMetadata = this.tokenMetadataRepository.create({
                unit: token?.subject || blockfrostToken?.asset,
                name: token?.name?.value || blockfrostToken?.metadata?.name || blockfrostToken?.onchain_metadata?.name,
                logo,
                ticker: token?.ticker?.value || blockfrostToken?.metadata?.ticker || blockfrostToken?.onchain_metadata?.ticker,
                policy: token?.policy || blockfrostToken?.policy_id,
                description: token?.description?.value || blockfrostToken?.metadata?.description || blockfrostToken?.onchain_metadata?.description,
                url: token?.url?.value || blockfrostToken?.metadata?.url,
                decimals: token?.decimals?.value || blockfrostToken?.metadata?.decimals || blockfrostToken?.onchain_metadata?.decimals || 0
            });

            await this.tokenMetadataRepository.save(tokenMetadata);
        }

        return pick(tokenMetadata, pickProperties);
    }

    async getTokensMetadata(units: string[], properties: string[]) {
        try {
            const pickProperties = ['unit'].concat(properties);
            const tokenMetadata = await this.tokenMetadataRepository.find({ where: { unit: In(units) } });
            const missingUnits = units.filter(unit => !tokenMetadata.some(tokenMetadata => tokenMetadata.unit === unit));
            let savedTokenMetadataV1
            let savedTokenMetadataV2
            if (missingUnits.length > 0) {
                const missingTokenMetadata = await this.tokenCardanoService.batchTokenInfo(missingUnits);
                if (missingTokenMetadata?.subjects?.length > 0) {
                    savedTokenMetadataV1 = await this.tokenMetadataRepository.save(await Promise.all(missingTokenMetadata.subjects.map(async (tokenMetadata) => {

                        let logo
                        if (tokenMetadata.logo?.value) {
                            logo = await this.uploadTokenLogo(tokenMetadata.subject, tokenMetadata.logo.value);
                        }


                        const token = this.tokenMetadataRepository.create({
                            unit: tokenMetadata.subject,
                            name: tokenMetadata.name?.value,
                            logo,
                            ticker: tokenMetadata.ticker?.value,
                            policy: tokenMetadata.policy,
                            description: tokenMetadata.description?.value,
                            url: tokenMetadata.url?.value,
                            decimals: tokenMetadata.decimals?.value || 0,
                        });

                        return token;
                    })));
                }

                if (missingTokenMetadata?.subjects?.length < missingUnits.length) {
                    const missingIds = missingUnits.filter(unit => !missingTokenMetadata?.subjects?.some(tokenMetadata => tokenMetadata.subject === unit));
                    const missingTokenMetadataV2 = await Promise.all(missingIds.map(async (unit) => {
                        const blockfrostToken = await this.blockfrostService.getTokenDetail(unit);
                        return this.tokenMetadataRepository.create({
                            unit,
                            name: blockfrostToken?.metadata?.name || blockfrostToken?.onchain_metadata?.name,
                            logo: blockfrostToken?.metadata?.logo || blockfrostToken?.onchain_metadata?.image,
                            ticker: blockfrostToken?.metadata?.ticker || blockfrostToken?.onchain_metadata?.ticker,
                            policy: blockfrostToken?.policy_id,
                            description: blockfrostToken?.metadata?.description || blockfrostToken?.onchain_metadata?.description,
                            url: blockfrostToken?.metadata?.url,
                            decimals: blockfrostToken?.metadata?.decimals || blockfrostToken?.onchain_metadata?.decimals || 0,
                        });
                    }));
                    savedTokenMetadataV2 = await this.tokenMetadataRepository.save(missingTokenMetadataV2);
                }

            }
            if (savedTokenMetadataV1) {
                tokenMetadata.push(...savedTokenMetadataV1);
            }

            if (savedTokenMetadataV2) {
                tokenMetadata.push(...savedTokenMetadataV2);
            }

            return tokenMetadata.map(tokenMetadata => {
                if (properties.length === 0) {
                    return tokenMetadata;
                }

                return pick(tokenMetadata, pickProperties);
            });
        } catch (error) {
            console.log({ error });
            return [];
        }
    }

    async uploadTokenLogo(unit: string, logo: string) {
        const logoUrl = await this.s3Service.uploadS3(Buffer.from(logo, 'base64'), `logo/${unit}.png`, 'image/png', 'token-metadata');
        return logoUrl;
    }
}
