import { BaseEntity } from "@database/common/base.entity";
import { UserPointLogEntity } from "@database/entities/user-point-log.entity";
import { UserEntity } from "@database/entities/user.entity";

import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";

@Entity({ name: 'user_referrals' })
export class UserReferralEntity extends BaseEntity {

  @Column({ type: 'int', name: 'user_id', unique: true })
  userId: number;

  @Column({ type: 'int', name: 'referred_by' })
  referredBy: number;

  @ManyToOne(() => UserEntity, (user) => user.id)
  @JoinColumn({ name: 'referred_by' })
  referredByUser: UserEntity;

  @ManyToOne(() => UserEntity, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ type: 'decimal', name: 'points', default: 0 })
  points: string;

  @OneToMany(() => UserPointLogEntity, (userPointLog) => userPointLog.referral)
  userPointLogs: UserPointLogEntity[];
}
