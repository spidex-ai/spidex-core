import { Column, Entity, Index, JoinColumn, ManyToOne, OneToOne } from 'typeorm';

import { EUserPointType } from '../../modules/user-point/user-point.constant';
import { BaseEntity } from '@database/common/base.entity';
import { UserEntity } from '@database/entities/user.entity';
import { UserReferralEntity } from '@database/entities/user-referral.entity';
import { UserQuestEntity } from '@database/entities/user-quest.entity';
export enum EUserPointLogType {
  FROM_QUEST = 'from_quest',
  FROM_REFERRAL = 'from_referral',
  FROM_SYSTEM = 'from_system',
  FROM_CORE = 'from_core',
}

@Entity('user_point_logs')
@Index('idx_user_point_log_created_at', ['createdAt'])
@Index('idx_user_point_created_amount', ['createdAt', 'userId', 'amount'])
export class UserPointLogEntity extends BaseEntity {
  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @Column({ type: 'decimal', precision: 36, scale: 8, default: '0' })
  amount: string;

  @Column({ name: 'point_type', type: 'enum', enum: EUserPointType })
  pointType: EUserPointType;

  @Column({ name: 'log_type', type: 'enum', enum: EUserPointLogType })
  logType: EUserPointLogType;

  @ManyToOne(() => UserEntity, user => user.userPointLogs)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: UserEntity;

  @Column({ name: 'user_quest_id', type: 'int', nullable: true })
  userQuestId?: number;

  @OneToOne(() => UserQuestEntity, quest => quest.userPointLog)
  @JoinColumn({ name: 'user_quest_id', referencedColumnName: 'id' })
  userQuest?: UserQuestEntity;

  @Column({ name: 'referral_id', type: 'int', nullable: true })
  referralId?: number;

  @ManyToOne(() => UserReferralEntity, referral => referral.userPointLogs)
  @JoinColumn({ name: 'referral_id', referencedColumnName: 'id' })
  referral?: UserReferralEntity;
}
