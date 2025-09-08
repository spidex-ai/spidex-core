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
import { TokenCardanoInfoSubject } from 'external/token-cardano/types';
import { isNil, keys, pick } from 'lodash';
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
      if (token?.metadata?.logo?.value) {
        logo = await this.uploadTokenLogo(token.subject, token.metadata.logo.value);
      } else if (blockfrostToken?.metadata?.logo) {
        logo = await this.uploadTokenLogo(token?.subject || blockfrostToken?.asset, blockfrostToken?.metadata?.logo);
      } else if (blockfrostToken?.onchain_metadata?.image) {
        logo = blockfrostToken?.onchain_metadata?.image;
      }

      tokenMetadata = this.tokenMetadataRepository.create({
        unit: token?.subject || blockfrostToken?.asset,
        name:
          token?.metadata?.name?.value || blockfrostToken?.metadata?.name || blockfrostToken?.onchain_metadata?.name,
        logo,
        ticker:
          token?.metadata?.ticker?.value ||
          blockfrostToken?.metadata?.ticker ||
          blockfrostToken?.onchain_metadata?.ticker,
        policy: blockfrostToken?.policy_id,
        description:
          token?.metadata?.description?.value ||
          blockfrostToken?.metadata?.description ||
          blockfrostToken?.onchain_metadata?.description,
        url: token?.metadata?.url?.value || blockfrostToken?.metadata?.url,
        decimals:
          Number(token?.metadata?.decimals?.value) ||
          blockfrostToken?.metadata?.decimals ||
          blockfrostToken?.onchain_metadata?.decimals ||
          0,
        nameHex: blockfrostToken?.asset_name,
      });

      await this.tokenMetadataRepository.save(tokenMetadata);
    }

    let blockfrostToken: BlockfrostTokenDetail;
    let cardanoToken: TokenCardanoInfoSubject;
    console.log('tokenMetadata', tokenMetadata);
    for (const property of pickProperties) {
      if (!tokenMetadata[property]) {
        console.log('Fetch missing property', property);
        if (!blockfrostToken) {
          blockfrostToken = await this.blockfrostService.getTokenDetail(unit);
        }
        console.log({ blockfrostToken });

        if (!cardanoToken) {
          cardanoToken = await this.tokenCardanoService.tokenInfo(unit);
        }
        switch (property) {
          case 'logo':
            if (cardanoToken?.metadata?.logo?.value) {
              tokenMetadata.logo = await this.uploadTokenLogo(unit, cardanoToken.metadata.logo.value);
            } else if (blockfrostToken?.metadata?.logo) {
              tokenMetadata.logo = await this.uploadTokenLogo(unit, blockfrostToken?.metadata?.logo);
            } else if (blockfrostToken?.onchain_metadata?.image) {
              tokenMetadata.logo = blockfrostToken?.onchain_metadata?.image;
            }
            break;
          case 'name':
            tokenMetadata.name =
              cardanoToken?.metadata?.name?.value ||
              blockfrostToken?.metadata?.name ||
              blockfrostToken?.onchain_metadata?.name;
            break;
          case 'ticker':
            tokenMetadata.ticker =
              cardanoToken?.metadata?.ticker?.value ||
              blockfrostToken?.metadata?.ticker ||
              blockfrostToken?.onchain_metadata?.ticker;
            break;
          case 'description':
            tokenMetadata.description =
              cardanoToken?.metadata?.description?.value ||
              blockfrostToken?.metadata?.description ||
              blockfrostToken?.onchain_metadata?.description;
            break;
          case 'url':
            tokenMetadata.url = cardanoToken?.metadata?.url?.value || blockfrostToken?.metadata?.url;
            break;
          case 'decimals':
            tokenMetadata.decimals =
              Number(cardanoToken?.metadata?.decimals?.value) ||
              blockfrostToken?.metadata?.decimals ||
              blockfrostToken?.onchain_metadata?.decimals ||
              0;
          case 'nameHex':
            tokenMetadata.nameHex = blockfrostToken?.asset_name;
            break;
          case 'policy':
            tokenMetadata.policy = blockfrostToken?.policy_id;
            break;
          default:
            break;
        }

        await this.tokenMetadataRepository.save(tokenMetadata);
      }
    }

    return pick(tokenMetadata, pickProperties);
  }

  private validateAndPreprocessInputs(units: Set<string>, properties: Set<TokenMetadataProperties>) {
    const filteredUnits = new Set(Array.from(units).filter(unit => unit !== null && unit !== undefined));
    const filteredProperties = new Set(Array.from(properties).filter(prop => prop !== null && prop !== undefined));

    let adaMetadata = null;
    if (filteredUnits.has(CARDANO_UNIT)) {
      filteredUnits.delete(CARDANO_UNIT);
      adaMetadata = this.getAda(Array.from(filteredProperties));
    }

    return {
      filteredUnits,
      filteredProperties,
      adaMetadata,
      unitsArray: Array.from(filteredUnits),
      propertiesArray: Array.from(filteredProperties),
      pickProperties: ['unit'].concat(Array.from(filteredProperties)),
    };
  }

  private async getExistingMetadata(units: string[]): Promise<Map<string, TokenMetadataEntity>> {
    const tokenMetadataList = await this.tokenMetadataRepository.find({
      where: { unit: In(units) },
    });
    return new Map(tokenMetadataList.map(t => [t.unit, t]));
  }

  private async fetchCardanoTokens(missingUnits: string[]): Promise<Map<string, TokenCardanoInfoSubject>> {
    const cardanoBatchMap = new Map();

    if (missingUnits.length > 0) {
      const cardanoBatch = await this.tokenCardanoService.batchTokenInfo(missingUnits);
      if (cardanoBatch?.subjects?.length) {
        for (const subject of cardanoBatch.subjects) {
          if (keys(subject.metadata || {}).length > 0) {
            cardanoBatchMap.set(subject.subject, subject);
          }
        }
      }
    }

    return cardanoBatchMap;
  }

  private async fetchBlockfrostTokens(missingUnits: string[]): Promise<Map<string, BlockfrostTokenDetail>> {
    const blockfrostMap = new Map();

    if (missingUnits.length > 0) {
      const blockfrostResults = await Promise.allSettled(
        missingUnits.map(async unit => {
          const token = await this.blockfrostService.getTokenDetail(unit);
          return { unit, token };
        }),
      );

      for (const result of blockfrostResults) {
        if (result.status === 'fulfilled' && result.value.token) {
          blockfrostMap.set(result.value.unit, result.value.token);
        }
      }
    }

    return blockfrostMap;
  }

  private async createTokenEntity(
    unit: string,
    cardanoToken: TokenCardanoInfoSubject,
    blockfrostToken: BlockfrostTokenDetail,
  ): Promise<TokenMetadataEntity> {
    let logo: string | undefined;

    // Handle logo from Cardano token
    if (cardanoToken?.metadata?.logo?.value) {
      logo = await this.uploadTokenLogo(cardanoToken.subject, cardanoToken.metadata.logo.value);
    }
    // Handle logo from Blockfrost
    else if (blockfrostToken?.metadata?.logo) {
      logo = await this.uploadTokenLogo(unit, blockfrostToken.metadata.logo);
    }
    // Handle image from Blockfrost onchain metadata
    else if (blockfrostToken?.onchain_metadata?.image) {
      logo = blockfrostToken.onchain_metadata.image;
    }

    // Determine the correct unit to use
    const entityUnit = cardanoToken?.subject || blockfrostToken?.asset || unit;
    const name =
      cardanoToken?.metadata?.name?.value || blockfrostToken?.metadata?.name || blockfrostToken?.onchain_metadata?.name;

    return this.tokenMetadataRepository.create({
      unit: entityUnit,
      name,
      logo,
      ticker:
        cardanoToken?.metadata?.ticker?.value ||
        blockfrostToken?.metadata?.ticker ||
        blockfrostToken?.onchain_metadata?.ticker,
      policy: blockfrostToken?.policy_id,
      description:
        cardanoToken?.metadata?.description?.value ||
        blockfrostToken?.metadata?.description ||
        blockfrostToken?.onchain_metadata?.description,
      url: cardanoToken?.metadata?.url?.value || blockfrostToken?.metadata?.url,
      decimals:
        Number(cardanoToken?.metadata?.decimals?.value) ||
        blockfrostToken?.metadata?.decimals ||
        blockfrostToken?.onchain_metadata?.decimals ||
        0,
      nameHex: blockfrostToken?.asset_name,
    });
  }

  private async createAndSaveNewEntities(
    missingUnits: string[],
    cardanoBatchMap: Map<string, TokenCardanoInfoSubject>,
    blockfrostMap: Map<string, BlockfrostTokenDetail>,
  ): Promise<Map<string, TokenMetadataEntity>> {
    const tokenMetadataMap = new Map<string, TokenMetadataEntity>();
    const entitiesToSave: TokenMetadataEntity[] = [];

    for (const unit of missingUnits) {
      const cardanoToken = cardanoBatchMap.get(unit);
      const blockfrostToken = blockfrostMap.get(unit);

      if (cardanoToken || blockfrostToken) {
        const entity = await this.createTokenEntity(unit, cardanoToken, blockfrostToken);
        entitiesToSave.push(entity);
        tokenMetadataMap.set(unit, entity);
      } else {
        tokenMetadataMap.set(unit, null);
      }
    }

    if (entitiesToSave.length > 0) {
      await this.tokenMetadataRepository.save(entitiesToSave);
    }

    return tokenMetadataMap;
  }

  private async updateMissingProperties(
    tokenMetadata: TokenMetadataEntity,
    unit: string,
    properties: string[],
    cardanoToken: TokenCardanoInfoSubject,
    blockfrostToken: BlockfrostTokenDetail,
  ): Promise<void> {
    let needsUpdate = false;

    for (const property of properties) {
      if (isNil(tokenMetadata[property])) {
        needsUpdate = true;

        switch (property) {
          case 'logo':
            if (cardanoToken?.metadata?.logo?.value) {
              tokenMetadata.logo = await this.uploadTokenLogo(unit, cardanoToken.metadata.logo.value);
            } else if (blockfrostToken?.metadata?.logo) {
              tokenMetadata.logo = await this.uploadTokenLogo(unit, blockfrostToken.metadata.logo);
            } else if (blockfrostToken?.onchain_metadata?.image) {
              tokenMetadata.logo = blockfrostToken?.onchain_metadata?.image;
            } else {
              tokenMetadata.logo = '';
            }
            break;
          case 'name':
            tokenMetadata.name =
              cardanoToken?.metadata?.name?.value ||
              blockfrostToken?.metadata?.name ||
              blockfrostToken?.onchain_metadata?.name ||
              '';
            break;
          case 'ticker':
            tokenMetadata.ticker =
              cardanoToken?.metadata?.ticker?.value ||
              blockfrostToken?.metadata?.ticker ||
              blockfrostToken?.onchain_metadata?.ticker ||
              '';
            break;
          case 'description':
            tokenMetadata.description =
              cardanoToken?.metadata?.description?.value ||
              blockfrostToken?.metadata?.description ||
              blockfrostToken?.onchain_metadata?.description ||
              '';
            break;
          case 'url':
            tokenMetadata.url = cardanoToken?.metadata?.url?.value || blockfrostToken?.metadata?.url || '';
            break;
          case 'decimals':
            tokenMetadata.decimals =
              Number(cardanoToken?.metadata?.decimals?.value) ||
              blockfrostToken?.metadata?.decimals ||
              blockfrostToken?.onchain_metadata?.decimals ||
              0;
            break;
          case 'nameHex':
            tokenMetadata.nameHex = blockfrostToken?.asset_name;
            break;
          case 'policy':
            tokenMetadata.policy = blockfrostToken?.policy_id;
            break;
        }
      }
    }

    if (needsUpdate) {
      await this.tokenMetadataRepository.save(tokenMetadata);
    }
  }

  async getTokensMetadata(units: Set<string>, properties: Set<TokenMetadataProperties>): Promise<any[]> {
    console.time('getTokensMetadata');

    try {
      // 1. Validate and preprocess inputs
      const { filteredUnits, adaMetadata, unitsArray, pickProperties } = this.validateAndPreprocessInputs(
        units,
        properties,
      );

      if (filteredUnits.size === 0) {
        return adaMetadata ? [adaMetadata] : [];
      }

      // 2. Get existing metadata from database
      const existingMetadataMap = await this.getExistingMetadata(unitsArray);

      // 3. Identify missing units that need external fetching
      const missingUnits = unitsArray.filter(unit => !existingMetadataMap.has(unit));

      // 4. Fetch missing tokens from external sources
      const cardanoBatchMap = await this.fetchCardanoTokens(missingUnits);
      const stillMissingUnits = missingUnits.filter(unit => !cardanoBatchMap.has(unit));
      const blockfrostMap = await this.fetchBlockfrostTokens(stillMissingUnits);

      // 5. Create and save new entities for missing tokens
      const newEntitiesMap = await this.createAndSaveNewEntities(missingUnits, cardanoBatchMap, blockfrostMap);

      // 6. Combine existing and new metadata
      const combinedMetadataMap = new Map([...existingMetadataMap, ...newEntitiesMap]);

      // 7. Build results and ensure all requested properties are present
      const results = [];

      if (adaMetadata) {
        results.push(adaMetadata);
      }

      for (const unit of filteredUnits) {
        const tokenMetadata = combinedMetadataMap.get(unit);

        if (!tokenMetadata) {
          results.push(null);
          continue;
        }

        // Check if any properties are missing and update if needed
        const cardanoToken = cardanoBatchMap?.get(unit);
        const blockfrostToken = blockfrostMap?.get(unit);

        if (cardanoToken || blockfrostToken) {
          await this.updateMissingProperties(tokenMetadata, unit, pickProperties, cardanoToken, blockfrostToken);
        }

        results.push(pick(tokenMetadata, pickProperties));
      }

      return results;
    } catch (error) {
      console.error('Error in getTokensMetadata:', error);
      return [];
    } finally {
      console.timeEnd('getTokensMetadata');
    }
  }

  async uploadTokenLogo(unit: string, logo: string) {
    if (logo.startsWith('http')) {
      console.warn('Logo is a URL, skipping upload to S3:', logo);
      return logo;
    }
    if (logo.startsWith('ipfs://')) {
      console.warn('Logo is an IPFS link, skipping upload to S3:', logo);
      return logo;
    }

    console.debug('Uploading logo to S3 for unit:', unit, logo.slice(0, 30) + '...');
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
