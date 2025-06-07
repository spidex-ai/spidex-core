import { EUserStatus } from '@constants/user.constant';
import { BaseExcludeDeletedAtEntity } from '@database/common/base.entity';
import { UserPointLogEntity } from '@database/entities/user-point-log.entity';
import { Column, DeepPartial, Entity, Index, OneToMany } from 'typeorm';

@Entity('users')
export class UserEntity extends BaseExcludeDeletedAtEntity {
  constructor(partial?: DeepPartial<UserEntity>) {
    super();
    Object.assign(this, partial);
  }
  @Index({ unique: true, where: 'wallet_address IS NOT NULL' })
  @Column({ name: 'wallet_address', nullable: true, default: null })
  walletAddress: string;

  @Index({ unique: true, where: 'username IS NOT NULL' })
  @Column({ name: 'username', nullable: true, default: null })
  username: string;

  @Column({ name: 'full_name', nullable: true, default: null })
  fullName: string;

  @Index({ unique: true, where: 'x_id IS NOT NULL' })
  @Column({ name: 'x_id', nullable: true, default: null })
  xId: string;

  @Column({ name: 'x_username', nullable: true, default: null })
  xUsername: string;

  @Index({ unique: true, where: 'discord_id IS NOT NULL' })
  @Column({ name: 'discord_id', nullable: true, default: null })
  discordId: string;

  @Column({ name: 'discord_username', nullable: true, default: null })
  discordUsername: string;

  @Index({ unique: true, where: 'telegram_id IS NOT NULL' })
  @Column({ name: 'telegram_id', nullable: true, default: null })
  telegramId: string;

  @Column({ name: 'telegram_username', nullable: true, default: null })
  telegramUsername: string;

  @Index({ unique: true, where: 'email IS NOT NULL' })
  @Column({ name: 'email', nullable: true, default: null })
  email: string;

  @Column({ name: 'bio', nullable: true, default: null })
  bio: string;

  @Column({ name: 'avatar', nullable: true, default: null })
  avatar: string;

  @Column({ name: 'status', default: EUserStatus.ACTIVE })
  status: string;

  @Column({ name: 'referral_code', nullable: true, default: null })
  referralCode: string;

  @OneToMany(() => UserPointLogEntity, userPointLog => userPointLog.user)
  userPointLogs: UserPointLogEntity[];
}
