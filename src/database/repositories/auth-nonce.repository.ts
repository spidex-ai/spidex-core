import { BaseRepository } from '@database/common/base.repository';
import { AuthNonceEntity, EAuthNonceStatus } from '@database/entities/auth-nonce.entity';
import { EntityRepository } from 'nestjs-typeorm-custom-repository';
import { LessThan } from 'typeorm';

@EntityRepository(AuthNonceEntity)
export class AuthNonceRepository extends BaseRepository<AuthNonceEntity> {
  async findActiveNonceByValue(nonce: string): Promise<AuthNonceEntity | null> {
    return this.findOne({
      where: {
        nonce,
        status: EAuthNonceStatus.ACTIVE,
      },
    });
  }

  async findActiveNoncesByWallet(walletAddress: string): Promise<AuthNonceEntity[]> {
    return this.find({
      where: {
        walletAddress,
        status: EAuthNonceStatus.ACTIVE,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async markNonceAsUsed(nonce: string): Promise<void> {
    await this.update(
      { nonce },
      {
        status: EAuthNonceStatus.USED,
        usedAt: new Date(),
      },
    );
  }

  async markExpiredNonces(): Promise<void> {
    await this.update(
      {
        status: EAuthNonceStatus.ACTIVE,
        expiresAt: LessThan(new Date()),
      },
      {
        status: EAuthNonceStatus.EXPIRED,
      },
    );
  }

  async cleanupExpiredNonces(olderThanDays: number = 7): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    await this.delete({
      status: EAuthNonceStatus.EXPIRED,
      expiresAt: LessThan(cutoffDate),
    });
  }

  async invalidateWalletNonces(walletAddress: string): Promise<void> {
    await this.update(
      {
        walletAddress,
        status: EAuthNonceStatus.ACTIVE,
      },
      {
        status: EAuthNonceStatus.EXPIRED,
      },
    );
  }
}
