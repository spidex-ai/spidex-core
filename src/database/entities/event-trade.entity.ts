import { BaseEntity } from '@database/common/base.entity';
import { SwapTransactionEntity } from '@database/entities/swap-transaction.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Decimal } from 'decimal.js';
import { EventEntity } from './event.entity';
import { EventParticipantEntity } from './event-participant.entity';
import { EEventTradeType } from '@modules/event/event.constant';

@Entity('event_trades')
@Index(['eventId'])
@Index(['participantId'])
@Index(['swapTransactionId'])
@Index(['volumeUsd'])
@Index(['tokenTraded'])
export class EventTradeEntity extends BaseEntity {
  @Column({ name: 'event_id' })
  eventId: number;

  @Column({ name: 'participant_id' })
  participantId: number;

  @Column({ name: 'swap_transaction_id' })
  swapTransactionId: number;

  @Column({
    name: 'volume_usd',
    type: 'decimal',
    precision: 36,
    scale: 18,
  })
  volumeUsd: Decimal;

  @Column({ name: 'token_traded' })
  tokenTraded: string;

  @Column({ name: 'token_amount', type: 'decimal', precision: 36, scale: 18 })
  tokenAmount: Decimal;

  @Column({ name: 'trade_type', type: 'enum', enum: EEventTradeType })
  tradeType: EEventTradeType;

  @Column({ name: 'recorded_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  recordedAt: Date;

  @ManyToOne(() => EventEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'event_id' })
  event: EventEntity;

  @ManyToOne(() => EventParticipantEntity, participant => participant.trades, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'participant_id' })
  participant: EventParticipantEntity;

  @ManyToOne(() => SwapTransactionEntity)
  @JoinColumn({ name: 'swap_transaction_id' })
  swapTransaction: SwapTransactionEntity;

  constructor(partial: Partial<EventTradeEntity>) {
    super();
    Object.assign(this, partial);
  }
}
