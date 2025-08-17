import { BaseRepository } from '@database/common/base.repository';
import { TokenMetadataEntity } from '@database/entities/token-metadata.entity';
import { EntityRepository } from 'nestjs-typeorm-custom-repository';

@EntityRepository(TokenMetadataEntity)
export class TokenMetadataRepository extends BaseRepository<TokenMetadataEntity> {}
