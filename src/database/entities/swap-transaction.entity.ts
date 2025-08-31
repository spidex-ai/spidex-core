import { BaseExcludeDeletedAtEntity } from '@database/common/base.entity';
import { Column, Entity, Index } from 'typeorm';

export enum SwapExchange {
  DEXHUNTER = 'dexhunter',
  MINSWAP = 'minswap',
  CARDEXSCAN = 'cardexscan',
}

export enum SwapAction {
  BUY = 'buy',
  SELL = 'sell',
}

export enum SwapStatus {
  BUILDING = 'building',
  SUBMITTED = 'submitted',
  SUCCESS = 'success',
  FAILED = 'failed',
}

@Entity('swap_transactions')
@Index(['cborHex', 'action'], { unique: true })
@Index(['txHash', 'action'], { unique: true })
@Index(['txHash', 'status'])
@Index(['cborHex'])
@Index(['txHash'])
export class SwapTransactionEntity extends BaseExcludeDeletedAtEntity {
  @Column({ type: 'enum', enum: SwapAction })
  action: SwapAction;

  @Column({ type: 'int', name: 'user_id' })
  userId: number;

  @Column({ type: 'enum', enum: SwapStatus, default: SwapStatus.BUILDING })
  status: SwapStatus;

  @Column({ type: 'varchar', name: 'address' })
  address: string;

  @Column({ type: 'varchar', name: 'tx_hash', nullable: true })
  txHash: string;

  @Column({ type: 'varchar', name: 'exchange' })
  exchange: string;

  @Column({ type: 'varchar', name: 'hash', nullable: true })
  hash: string;

  @Column({ type: 'varchar', name: 'lp_token_unit', nullable: true })
  lpTokenUnit: string;

  @Column({ type: 'decimal', precision: 36, scale: 18, nullable: true })
  price: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  @Column({ type: 'varchar', name: 'token_a', nullable: true })
  tokenA: string;

  @Column({ type: 'decimal', name: 'token_a_amount', precision: 36, scale: 18 })
  tokenAAmount: string;

  @Column({ type: 'varchar', name: 'token_a_name' })
  tokenAName: string;

  @Column({ type: 'varchar', name: 'token_b', nullable: true })
  tokenB: string;

  @Column({ type: 'decimal', name: 'token_b_amount', precision: 36, scale: 18 })
  tokenBAmount: string;

  @Column({ type: 'varchar', name: 'token_b_name' })
  tokenBName: string;

  @Column({ type: 'text', name: 'cbor_hex' })
  cborHex: string;

  @Column({ type: 'decimal', name: 'total_fee', precision: 36, scale: 18 })
  totalFee: number;

  @Column({ type: 'decimal', name: 'total_usd', precision: 36, scale: 18 })
  totalUsd: string;
}
