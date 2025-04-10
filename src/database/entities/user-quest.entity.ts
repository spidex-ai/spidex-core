import { BaseEntity } from "@database/common/base.entity";
import { QuestEntity } from "@database/entities/quest.entity";
import { UserPointLogEntity } from "@database/entities/user-point-log.entity";
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToOne } from "typeorm";

@Entity('user_quests')
@Index('user_quest_created_at_idx', ['createdAt'])
@Index('user_quest_user_id_quest_id_created_at_deleted_at_idx', ['userId', 'questId', 'createdAt', 'deletedAt'])
export class UserQuestEntity extends BaseEntity {

  @Column({ type: 'int', name: 'user_id', nullable: false })
  userId: number;

  @Column({ type: 'int', name: 'quest_id', nullable: false })
  questId: number;

  @Column({ type: 'decimal', name: 'points', nullable: false })
  points: number;

  @OneToOne(() => UserPointLogEntity, (pointLog) => pointLog.userQuest)
  userPointLog: UserPointLogEntity;

  @ManyToOne(() => QuestEntity, (quest) => quest.userQuests)
  @JoinColumn({ name: 'quest_id' })
  quest: QuestEntity;
}


