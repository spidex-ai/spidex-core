import { BaseEntity } from '@database/common/base.entity';
import { ZealyUserQuestEntity } from '@database/entities/zealy-user-quest.entity';
import { Column, Entity, OneToMany } from 'typeorm';

export enum EZealyQuestCategory {
  ONE_TIME = 0,
  DAILY = 1,
  MULTI_TIME = 2,
}

export enum EZealyQuestType {
  REFERRAL_CHECK = 0,
  TRADE_CHECK = 1,
}

export enum EZealyQuestStatus {
  ACTIVE = 1,
  INACTIVE = 0,
}

export interface IZealyReferralCheckRequirement {
  referralCount: number;
}

export interface IZealyTradeCheckRequirement {
  amount: number;
  token: string;
}

export type TQuestRequirement = IZealyReferralCheckRequirement | IZealyTradeCheckRequirement;

@Entity('zealy_quests')
export class ZealyQuestEntity extends BaseEntity {
  @Column({ type: 'varchar', name: 'zealy_quest_id', nullable: false, unique: true })
  zealyQuestId: string;

  @Column({ type: 'varchar', name: 'name', nullable: false })
  name: string;

  @Column({ type: 'enum', name: 'category', enum: EZealyQuestCategory })
  category: EZealyQuestCategory;

  @Column({ type: 'enum', name: 'type', enum: EZealyQuestType, nullable: false })
  type: EZealyQuestType;

  @Column({ type: 'jsonb', name: 'requirements', nullable: true })
  requirements: TQuestRequirement;

  @Column({ type: 'enum', name: 'status', enum: EZealyQuestStatus, nullable: false, default: EZealyQuestStatus.ACTIVE })
  status: EZealyQuestStatus;

  @Column({ type: 'boolean', name: 'has_duration', nullable: false, default: false })
  hasDuration: boolean;

  @Column({ name: 'start_date', type: 'timestamp', nullable: true })
  startDate: Date;

  @Column({ name: 'end_date', type: 'timestamp', nullable: true })
  endDate: Date;

  @OneToMany(() => ZealyUserQuestEntity, zealyUserQuest => zealyUserQuest.zealyQuest)
  zealyUserQuests: ZealyUserQuestEntity[];
}
