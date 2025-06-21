import { BaseExcludeDeletedAtEntity } from '@database/common/base.entity';
import { Column, Entity, Index } from 'typeorm';

export enum EAuthNonceStatus {
  ACTIVE = 'ACTIVE',
  USED = 'USED',
  EXPIRED = 'EXPIRED',
}

@Entity('auth_nonces')
@Index(['nonce'], { unique: true })
@Index(['walletAddress', 'status'])
@Index(['expiresAt'])
export class AuthNonceEntity extends BaseExcludeDeletedAtEntity {
  @Column({ type: 'varchar', name: 'nonce', nullable: false, unique: true })
  nonce: string;

  @Column({ type: 'varchar', name: 'wallet_address', nullable: false })
  walletAddress: string;

  @Column({
    type: 'enum',
    name: 'status',
    enum: EAuthNonceStatus,
    nullable: false,
    default: EAuthNonceStatus.ACTIVE,
  })
  status: EAuthNonceStatus;

  @Column({ type: 'timestamp', name: 'expires_at', nullable: false })
  expiresAt: Date;

  @Column({ type: 'varchar', name: 'challenge_message', nullable: false })
  challengeMessage: string;

  @Column({ type: 'timestamp', name: 'used_at', nullable: true })
  usedAt: Date;
}
