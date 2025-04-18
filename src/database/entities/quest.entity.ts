
import { BaseEntity } from "@database/common/base.entity";
import { UserQuestEntity } from "@database/entities/user-quest.entity";
import { Column, Entity, OneToMany } from "typeorm";

export enum EQuestCategory {
  ONE_TIME = 0,
  DAILY = 1,
  MULTI_TIME = 2,
}

export enum EQuestType {
  // One-time quest
  SOCIAL = 0,
  JOIN_DISCORD = 1,
  JOIN_TELEGRAM = 2,
  FOLLOW_X = 3,

  // Daily quest
  DAILY_LOGIN = 10,

  // Multi-time quest
  REFER_FRIEND = 20,
  FIRST_REFER = 21,

  // Trade quest
  FIRST_TRADE = 30,
  TRADE_VOLUME = 31,
  DAILY_TRADE = 32,
  TOTAL_TRADE_VOLUME = 33,
  TRADE_PARTNER_TOKEN = 34,

  // Prompt quest
  FIRST_PROMPT = 40,
  DAILY_PROMPT = 41,
  PROMPT_RELATED_TO_TRADING_AGENT = 42,
  PROMPT_RELATED_TO_TOKEN_AGENT = 43,
  PROMPT_RELATED_TO_KNOWLEDGE_AGENT = 44,
  PROMPT_RELATED_TO_PORTFOLIO_AGENT = 45,
  PROMPT_RELATED_TO_MARKET_AGENT = 46,
}

export enum EQuestStatus {
  ACTIVE = 1,
  INACTIVE = 0,
}

export const QUEST_UNLIMITED = -1;

export interface ISocialInteractRequirement {
  url: string;
}

export interface ITradeRequirement {
  amount: number;
}

export interface ITradeVolumeRequirement {
  amount: number;
}

export interface ITradePartnerTokenRequirement {
  token: string;
}

export type TQuestRequirement = ISocialInteractRequirement | ITradeRequirement | ITradePartnerTokenRequirement;

@Entity('quests')
export class QuestEntity extends BaseEntity {
  @Column({ type: 'varchar', name: 'name', nullable: false })
  name: string;

  @Column({ type: 'varchar', name: 'description', nullable: true })
  description: string;

  @Column({ type: 'enum', name: 'category', enum: EQuestCategory, nullable: false })
  category: EQuestCategory;

  @Column({ type: 'enum', name: 'type', enum: EQuestType, nullable: false })
  type: EQuestType;

  @Column({ type: 'jsonb', name: 'requirements', nullable: true })
  requirements?: TQuestRequirement;

  @Column({ type: 'integer', name: 'limit', default: 1 })
  limit: number;

  @Column({ type: 'decimal', name: 'points', nullable: false })
  points: number;

  @Column({ type: 'enum', name: 'status', enum: EQuestStatus, nullable: false })
  status: EQuestStatus;

  @Column({ name: 'start_date', type: 'timestamp', nullable: true })
  startDate: Date;

  @Column({ name: 'end_date', type: 'timestamp', nullable: true })
  endDate: Date;

  @OneToMany(() => UserQuestEntity, (userQuest) => userQuest.quest)
  userQuests: UserQuestEntity[];
}
