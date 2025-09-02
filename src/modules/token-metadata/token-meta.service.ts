import {
  CARDANO_DECIMALS,
  CARDANO_NAME,
  CARDANO_POLICY,
  CARDANO_TICKER,
  CARDANO_TOTAL_SUPPLY,
  CARDANO_UNIT,
} from '@constants/cardano.constant';
import { EEnvKey } from '@constants/env.constant';
import { TokenMetadataEntity, TokenMetadataProperties } from '@database/entities/token-metadata.entity';
import { TokenMetadataRepository } from '@database/repositories/token-metadata.repository';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Service } from 'external/aws/s3/s3.service';
import { BlockfrostService } from 'external/blockfrost/blockfrost.service';
import { BlockfrostTokenDetail } from 'external/blockfrost/types';
import { TokenCardanoService } from 'external/token-cardano/cardano-token.service';
import { TokenCardanoInfo } from 'external/token-cardano/types';
import { pick, isNil } from 'lodash';
import { In } from 'typeorm';
@Injectable()
export class TokenMetaService {
  constructor(
    private readonly tokenMetadataRepository: TokenMetadataRepository,
    private readonly s3Service: S3Service,
    private readonly tokenCardanoService: TokenCardanoService,
    private readonly blockfrostService: BlockfrostService,
    private readonly configService: ConfigService,
  ) {}

  async getTokenMetadata(unit: string, properties: TokenMetadataProperties[]): Promise<Partial<TokenMetadataEntity>> {
    if (!unit || !properties) {
      return null;
    }

    if (unit === CARDANO_UNIT) {
      return this.getAda(properties);
    }
    const pickProperties = ['unit'].concat(properties);
    let tokenMetadata = await this.tokenMetadataRepository.findOne({ where: { unit } });
    if (!tokenMetadata) {
      const [token, blockfrostToken] = await Promise.all([
        this.tokenCardanoService.tokenInfo(unit),
        this.blockfrostService.getTokenDetail(unit),
      ]);
      if (!token && !blockfrostToken) {
        return null;
      }
      let logo: string;
      if (token.logo?.value) {
        logo = await this.uploadTokenLogo(token.subject, token.logo.value);
      } else if (blockfrostToken?.metadata?.logo) {
        logo = await this.uploadTokenLogo(token.subject, blockfrostToken?.metadata?.logo);
      } else if (blockfrostToken?.onchain_metadata?.image) {
        logo = blockfrostToken?.onchain_metadata?.image;
      }

      tokenMetadata = this.tokenMetadataRepository.create({
        unit: token?.subject || blockfrostToken?.asset,
        name: token?.name?.value || blockfrostToken?.metadata?.name || blockfrostToken?.onchain_metadata?.name,
        logo,
        ticker: token?.ticker?.value || blockfrostToken?.metadata?.ticker || blockfrostToken?.onchain_metadata?.ticker,
        policy: token?.policy || blockfrostToken?.policy_id,
        description:
          token?.description?.value ||
          blockfrostToken?.metadata?.description ||
          blockfrostToken?.onchain_metadata?.description,
        url: token?.url?.value || blockfrostToken?.metadata?.url,
        decimals:
          token?.decimals?.value ||
          blockfrostToken?.metadata?.decimals ||
          blockfrostToken?.onchain_metadata?.decimals ||
          0,
      });

      await this.tokenMetadataRepository.save(tokenMetadata);
    }

    let blockfrostToken: BlockfrostTokenDetail;
    let cardanoToken: TokenCardanoInfo;
    for (const property of pickProperties) {
      if (!tokenMetadata[property]) {
        if (!blockfrostToken) {
          blockfrostToken = await this.blockfrostService.getTokenDetail(unit);
        }
        if (!cardanoToken) {
          cardanoToken = await this.tokenCardanoService.tokenInfo(unit);
        }
        switch (property) {
          case 'logo':
            if (cardanoToken?.logo?.value) {
              tokenMetadata.logo = await this.uploadTokenLogo(unit, cardanoToken?.logo?.value);
            } else if (blockfrostToken?.metadata?.logo) {
              tokenMetadata.logo = await this.uploadTokenLogo(unit, blockfrostToken?.metadata?.logo);
            } else if (blockfrostToken?.onchain_metadata?.image) {
              tokenMetadata.logo = blockfrostToken?.onchain_metadata?.image;
            }
            break;
          case 'name':
            tokenMetadata.name =
              cardanoToken?.name?.value || blockfrostToken?.metadata?.name || blockfrostToken?.onchain_metadata?.name;
            break;
          case 'ticker':
            tokenMetadata.ticker =
              cardanoToken?.ticker?.value ||
              blockfrostToken?.metadata?.ticker ||
              blockfrostToken?.onchain_metadata?.ticker;
            break;
          case 'description':
            tokenMetadata.description =
              cardanoToken?.description?.value ||
              blockfrostToken?.metadata?.description ||
              blockfrostToken?.onchain_metadata?.description;
            break;
          case 'url':
            tokenMetadata.url = cardanoToken?.url?.value || blockfrostToken?.metadata?.url;
            break;
          case 'decimals':
            tokenMetadata.decimals =
              cardanoToken?.decimals?.value ||
              blockfrostToken?.metadata?.decimals ||
              blockfrostToken?.onchain_metadata?.decimals ||
              0;
            break;
          default:
            break;
        }

        await this.tokenMetadataRepository.save(tokenMetadata);
      }
    }

    return pick(tokenMetadata, pickProperties);
  }

  async getTokensMetadata(units: Set<string>, properties: Set<TokenMetadataProperties>): Promise<any[]> {
    console.time('getTokensMetadata');
    // Filter null or undefined units and properties
    const filteredUnits = new Set(Array.from(units).filter(unit => unit !== null && unit !== undefined));
    const filteredProperties = new Set(Array.from(properties).filter(prop => prop !== null && prop !== undefined));

    try {
      if (filteredUnits.size === 0) {
        return [];
      }
      console.log(filteredUnits);

      let adaMetadata;
      if (filteredUnits.has(CARDANO_UNIT)) {
        filteredUnits.delete(CARDANO_UNIT);
        adaMetadata = this.getAda(Array.from(filteredProperties));
      }
      const unitsArray = Array.from(filteredUnits);
      const propertiesArray = Array.from(filteredProperties);
      const pickProperties = ['unit'].concat(propertiesArray);
      // 1. Fetch all existing metadata in one query
      const tokenMetadataList = await this.tokenMetadataRepository.find({ where: { unit: In(unitsArray) } });
      const tokenMetadataMap = new Map(tokenMetadataList.map(t => [t.unit, t]));
      // 2. Identify missing units
      const missingUnits = unitsArray.filter(unit => !tokenMetadataMap.has(unit));
      // 3. Batch fetch from Cardano
      const cardanoBatchMap = new Map();
      if (missingUnits.length > 0) {
        const cardanoBatch = await this.tokenCardanoService.batchTokenInfo(missingUnits);
        if (cardanoBatch?.subjects?.length) {
          for (const subject of cardanoBatch.subjects) {
            cardanoBatchMap.set(subject.subject, subject);
          }
        }
      }
      // 4. For units still missing after Cardano, fetch from Blockfrost in parallel
      const cardanoFoundUnits = Array.from(cardanoBatchMap.keys());
      const stillMissingUnits = missingUnits.filter(unit => !cardanoFoundUnits.includes(unit));
      const blockfrostMap = new Map();
      if (stillMissingUnits.length > 0) {
        const blockfrostResults = await Promise.allSettled(
          stillMissingUnits.map(unit => this.blockfrostService.getTokenDetail(unit)),
        );
        blockfrostResults.forEach((result, idx) => {
          if (result.status === 'fulfilled') {
            blockfrostMap.set(stillMissingUnits[idx], result.value);
          }
        });
      }
      // 5. Create and save new metadata for missing units
      for (const unit of missingUnits) {
        let token;
        let logo;
        if (cardanoBatchMap.has(unit)) {
          token = cardanoBatchMap.get(unit);
          if (token.logo?.value) {
            logo = await this.uploadTokenLogo(token.subject, token.logo.value);
          }
          const entity = this.tokenMetadataRepository.create({
            unit: token.subject,
            name: token.name?.value,
            logo,
            ticker: token.ticker?.value,
            policy: token.policy,
            description: token.description?.value,
            url: token.url?.value,
            decimals: token.decimals?.value || 0,
          });
          await this.tokenMetadataRepository.save(entity);
          tokenMetadataMap.set(unit, entity);
        } else if (blockfrostMap.has(unit)) {
          const blockfrostToken = blockfrostMap.get(unit);
          logo = blockfrostToken?.metadata?.logo || blockfrostToken?.onchain_metadata?.image;
          const entity = this.tokenMetadataRepository.create({
            unit,
            name: blockfrostToken?.metadata?.name || blockfrostToken?.onchain_metadata?.name,
            logo,
            ticker: blockfrostToken?.metadata?.ticker || blockfrostToken?.onchain_metadata?.ticker,
            policy: blockfrostToken?.policy_id,
            description: blockfrostToken?.metadata?.description || blockfrostToken?.onchain_metadata?.description,
            url: blockfrostToken?.metadata?.url,
            decimals: blockfrostToken?.metadata?.decimals || blockfrostToken?.onchain_metadata?.decimals || 0,
          });
          await this.tokenMetadataRepository.save(entity);
          tokenMetadataMap.set(unit, entity);
        } else {
          tokenMetadataMap.set(unit, null);
        }
      }
      // 6. Ensure all requested properties are present for each token
      const results = [];
      if (adaMetadata) {
        results.push(adaMetadata);
      }
      for (const unit of filteredUnits) {
        const tokenMetadata = tokenMetadataMap.get(unit);
        if (!tokenMetadata) {
          results.push(null);
          continue;
        }

        let blockfrostToken;
        let cardanoToken;
        for (const property of pickProperties) {
          if (isNil(tokenMetadata[property])) {
            console.debug(`Property ${property} is missing for token ${unit}`);
            if (!blockfrostToken) {
              blockfrostToken = blockfrostMap.get(unit) || (await this.blockfrostService.getTokenDetail(unit));
            }
            if (!cardanoToken) {
              cardanoToken = cardanoBatchMap.get(unit) || (await this.tokenCardanoService.tokenInfo(unit));
            }
            switch (property) {
              case 'logo':
                if (cardanoToken?.logo?.value) {
                  tokenMetadata.logo = await this.uploadTokenLogo(unit, cardanoToken?.logo?.value);
                } else if (blockfrostToken?.metadata?.logo) {
                  tokenMetadata.logo = await this.uploadTokenLogo(unit, blockfrostToken?.metadata?.logo);
                } else if (blockfrostToken?.onchain_metadata?.image) {
                  tokenMetadata.logo = blockfrostToken?.onchain_metadata?.image;
                } else {
                  tokenMetadata.logo = '';
                }
                break;
              case 'name':
                tokenMetadata.name =
                  cardanoToken?.name?.value ||
                  blockfrostToken?.metadata?.name ||
                  blockfrostToken?.onchain_metadata?.name ||
                  '';
                break;
              case 'ticker':
                tokenMetadata.ticker =
                  cardanoToken?.ticker?.value ||
                  blockfrostToken?.metadata?.ticker ||
                  blockfrostToken?.onchain_metadata?.ticker ||
                  '';
                break;
              case 'description':
                tokenMetadata.description =
                  cardanoToken?.description?.value ||
                  blockfrostToken?.metadata?.description ||
                  blockfrostToken?.onchain_metadata?.description ||
                  '';
                break;
              case 'url':
                tokenMetadata.url = cardanoToken?.url?.value || blockfrostToken?.metadata?.url || '';
                break;
              case 'decimals':
                tokenMetadata.decimals =
                  cardanoToken?.decimals?.value ||
                  blockfrostToken?.metadata?.decimals ||
                  blockfrostToken?.onchain_metadata?.decimals ||
                  0;
                break;
              default:
                break;
            }
            await this.tokenMetadataRepository.save(tokenMetadata);
          }
        }
        results.push(pick(tokenMetadata, pickProperties));
      }
      return results;
    } catch (error) {
      console.log({ error });
      return [];
    } finally {
      console.timeEnd('getTokensMetadata');
    }
  }

  async uploadTokenLogo(unit: string, logo: string) {
    const logoUrl = await this.s3Service.uploadS3(
      Buffer.from(logo, 'base64'),
      `logo/${unit}.png`,
      'image/png',
      'token-metadata',
    );
    return logoUrl;
  }

  getAda(properties: TokenMetadataProperties[]): Partial<TokenMetadataEntity> {
    const adaMetadata = {
      name: CARDANO_NAME,
      decimals: CARDANO_DECIMALS,
      token_id: CARDANO_UNIT,
      token_decimals: CARDANO_DECIMALS,
      token_policy: CARDANO_POLICY,
      token_ascii: CARDANO_TICKER,
      ticker: CARDANO_TICKER,
      is_verified: true,
      supply: CARDANO_TOTAL_SUPPLY,
      creation_date: new Date().toISOString(),
      price: 1,
      logo: `${this.configService.get(EEnvKey.APP_BASE_URL)}/public/icons/tokens/ada.svg`,
      unit: CARDANO_UNIT,
    };
    if (!properties || properties.length === 0) {
      return adaMetadata;
    }
    return {
      unit: CARDANO_UNIT,
      ...pick(adaMetadata, properties),
    };
  }
}
