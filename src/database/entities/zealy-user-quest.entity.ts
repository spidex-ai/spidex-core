import { BaseEntity } from '@database/common/base.entity';
import { ZealyQuestEntity } from '@database/entities/zealy-quest.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

export enum EZealyUserQuestStatus {
  COMPLETED = 0,
  FAILED = 1,
}

@Entity('zealy_user_quests')
@Index('zealy_user_quest_user_id_quest_id_idx', ['userId', 'zealyQuestId'])
@Index('zealy_user_quest_zealy_user_id_idx', ['zealyUserId'])
export class ZealyUserQuestEntity extends BaseEntity {
  @Column({ type: 'int', name: 'user_id', nullable: false })
  userId: number;

  @Column({ type: 'int', name: 'zealy_quest_id', nullable: false })
  zealyQuestId: number;

  @Column({ type: 'varchar', name: 'zealy_user_id', nullable: false })
  zealyUserId: string;

  @Column({ type: 'varchar', name: 'zealy_request_id', nullable: false })
  zealyRequestId: string;

  @Column({
    type: 'enum',
    name: 'status',
    enum: EZealyUserQuestStatus,
    default: EZealyUserQuestStatus.COMPLETED,
    nullable: false,
  })
  status: EZealyUserQuestStatus;

  @Column({ name: 'verified_at', type: 'timestamp', nullable: true })
  verifiedAt: Date;

  @ManyToOne(() => ZealyQuestEntity, zealyQuest => zealyQuest.zealyUserQuests)
  @JoinColumn({ name: 'zealy_quest_id' })
  zealyQuest: ZealyQuestEntity;
}
