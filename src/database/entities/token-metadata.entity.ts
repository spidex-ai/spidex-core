import { BaseExcludeDeletedAtEntity } from '@database/common/base.entity';
import { Column, Entity, Index } from 'typeorm';

export type TokenMetadataProperties =
  | 'name'
  | 'policy'
  | 'description'
  | 'url'
  | 'ticker'
  | 'decimals'
  | 'logo'
  | 'nameHex';

@Entity('token_metadata')
export class TokenMetadataEntity extends BaseExcludeDeletedAtEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', name: 'unit', unique: true })
  unit: string;

  @Column({ type: 'varchar', name: 'name', nullable: true })
  name: string;

  @Column({ type: 'varchar', name: 'policy', nullable: true })
  policy: string;

  @Column({ type: 'varchar', name: 'description', nullable: true })
  description: string;

  @Column({ type: 'varchar', name: 'url', nullable: true })
  url: string;

  @Column({ type: 'varchar', name: 'ticker', nullable: true })
  ticker: string;

  @Column({ type: 'int', name: 'decimals', nullable: true })
  decimals: number;

  @Column({ type: 'varchar', name: 'name_hex', nullable: true })
  nameHex: string;

  @Column({ type: 'varchar', name: 'logo', nullable: true })
  logo: string;
}
