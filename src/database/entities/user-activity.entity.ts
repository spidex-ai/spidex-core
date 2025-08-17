import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@database/common/base.entity';
import { UserEntity } from '@database/entities/user.entity';

@Entity('user_activities')
@Index('idx_user_activity_user_date', ['userId', 'activityDate'])
@Index('idx_user_activity_date', ['activityDate'])
@Index('idx_user_activity_timestamp', ['timestamp'])
@Index('idx_user_activity_mau', ['activityDate', 'userId']) // For MAU calculations
@Index('idx_user_activity_dau', ['activityDate']) // For DAU calculations
export class UserActivityEntity extends BaseEntity {
  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @Column({ name: 'timestamp', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  @Column({ name: 'activity_date', type: 'date', default: () => 'CURRENT_DATE' })
  activityDate: Date;

  @Column({ name: 'endpoint', nullable: true })
  endpoint: string;

  @Column({ name: 'method', nullable: true })
  method: string;

  @Column({ name: 'user_agent', nullable: true })
  userAgent: string;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}