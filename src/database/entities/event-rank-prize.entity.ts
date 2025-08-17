import { BaseEntity } from '@database/common/base.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Decimal } from 'decimal.js';
import { EventEntity } from './event.entity';

@Entity('event_rank_prizes')
@Index(['eventId'])
@Index(['rankFrom', 'rankTo'])
export class EventRankPrizeEntity extends BaseEntity {
  @Column({ name: 'event_id' })
  eventId: number;

  @Column({ name: 'rank_from' })
  rankFrom: number;

  @Column({ name: 'rank_to' })
  rankTo: number;

  @Column({
    name: 'prize_points',
    type: 'decimal',
    precision: 36,
    scale: 18,
    default: 0,
  })
  prizePoints: Decimal;

  @Column({ name: 'prize_token', nullable: true })
  prizeToken: string;

  @Column({
    name: 'prize_token_amount',
    type: 'decimal',
    precision: 36,
    scale: 18,
    nullable: true,
  })
  prizeTokenAmount: Decimal;

  @Column({ name: 'description', nullable: true })
  description: string;

  @ManyToOne(() => EventEntity, event => event.rankPrizes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'event_id' })
  event: EventEntity;

  constructor(partial: Partial<EventRankPrizeEntity>) {
    super();
    Object.assign(this, partial);
  }
}
