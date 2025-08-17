import { BaseEntity } from '@database/common/base.entity';
import { UserEntity } from '@database/entities/user.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, Unique } from 'typeorm';
import { Decimal } from 'decimal.js';
import { EventEntity } from './event.entity';
import { EventTradeEntity } from './event-trade.entity';

@Entity('event_participants')
@Index(['eventId'])
@Index(['userId'])
@Index(['eventId', 'userId'])
@Index(['totalVolume'])
@Index(['rank'])
@Unique('UQ_EVENT_PARTICIPANT', ['eventId', 'userId'])
export class EventParticipantEntity extends BaseEntity {
  @Column({ name: 'event_id' })
  eventId: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({
    name: 'total_volume',
    type: 'decimal',
    precision: 36,
    scale: 18,
    default: 0,
  })
  totalVolume: Decimal;

  @Column({ name: 'trade_count', default: 0 })
  tradeCount: number;

  @Column({ name: 'rank', nullable: true })
  rank: number;

  @Column({ name: 'prize_claimed', default: false })
  prizeClaimed: boolean;

  @Column({ name: 'prize_claimed_at', type: 'timestamp', nullable: true })
  prizeClaimedAt: Date;

  @Column({ name: 'joined_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  joinedAt: Date;

  @Column({ name: 'last_trade_at', type: 'timestamp', nullable: true })
  lastTradeAt: Date;

  @ManyToOne(() => EventEntity, event => event.participants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'event_id' })
  event: EventEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @OneToMany(() => EventTradeEntity, trade => trade.participant, {
    cascade: true,
  })
  trades: EventTradeEntity[];

  constructor(partial: Partial<EventParticipantEntity>) {
    super();
    Object.assign(this, partial);
  }
}
