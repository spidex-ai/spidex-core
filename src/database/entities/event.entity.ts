import { BaseEntity } from '@database/common/base.entity';
import { UserEntity } from '@database/entities/user.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { Decimal } from 'decimal.js';
import { EventParticipantEntity } from './event-participant.entity';
import { EventRankPrizeEntity } from './event-rank-prize.entity';

export enum EEventStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ENDED = 'ENDED',
  CANCELLED = 'CANCELLED',
  PRIZES_DISTRIBUTED = 'PRIZES_DISTRIBUTED',
}

export enum EEventType {
  TRADING_COMPETITION = 'TRADING_COMPETITION',
  VOLUME_CHALLENGE = 'VOLUME_CHALLENGE',
  TOKEN_SPECIFIC = 'TOKEN_SPECIFIC',
}

@Entity('events')
@Index(['status'])
@Index(['startDate'])
@Index(['endDate'])
@Index(['createdAt'])
export class EventEntity extends BaseEntity {
  @Column({ name: 'name', length: 255 })
  name: string;

  @Column({ name: 'description', type: 'text' })
  description: string;

  @Column({ name: 'total_prize', type: 'decimal', precision: 36, scale: 18 })
  totalPrize: Decimal;

  @Column({ name: 'start_date', type: 'timestamp' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'timestamp' })
  endDate: Date;

  @Column({
    name: 'status',
    type: 'enum',
    enum: EEventStatus,
    default: EEventStatus.DRAFT,
  })
  status: EEventStatus;

  @Column({
    name: 'type',
    type: 'enum',
    enum: EEventType,
    default: EEventType.TRADING_COMPETITION,
  })
  type: EEventType;

  @Column({ name: 'trade_token', type: 'varchar' })
  tradeToken: string;

  @Column({ name: 'url', type: 'text', nullable: true })
  url?: string;

  @Column({ name: 'created_by', nullable: true })
  createdBy: number;

  @Column({ name: 'icon', nullable: true })
  icon: string;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: UserEntity;

  @OneToMany(() => EventRankPrizeEntity, 'event', {
    cascade: true,
  })
  rankPrizes: EventRankPrizeEntity[];

  @OneToMany(() => EventParticipantEntity, 'event', {
    cascade: true,
  })
  participants: EventParticipantEntity[];

  constructor(partial: Partial<EventEntity>) {
    super();
    Object.assign(this, partial);
  }
}
