import { BaseRepository } from '@database/common/base.repository';
import { UserPointEntity } from '@database/entities/user-point.entity';
import { UserEntity } from '@database/entities/user.entity';
import {
  LeaderboardStatsOutputDto,
  LeaderboardUserOutputDto,
} from '@modules/user-point/dtos/user-point-leaderboard.dto';
import { PageMetaDto, PaginationDto } from '@shared/dtos/page-meta.dto';
import { PageOptionsDto } from '@shared/dtos/page-option.dto';
import { PageDto } from '@shared/dtos/page.dto';
import { EntityRepository } from 'nestjs-typeorm-custom-repository';

@EntityRepository(UserPointEntity)
export class UserPointRepository extends BaseRepository<UserPointEntity> {
  async getLeaderboard(user: UserEntity, query: PaginationDto): Promise<PageDto<LeaderboardUserOutputDto>> {
    const { page, limit } = query;

    // Optimized query using LEFT JOIN instead of subquery for better performance
    const queryBuilder = this.createQueryBuilder('userPoint')
      .select([
        'userPoint.id',
        'userPoint.userId',
        'userPoint.amount',
        'userPoint.updatedAt',
        'user.username',
        'user.walletAddress',
        'user.avatar',
        'user.email',
        'user.fullName',
      ])
      .addSelect(`RANK() OVER (ORDER BY CAST(userPoint.amount AS DECIMAL) DESC, userPoint.updatedAt DESC)`, 'rank')
      .addSelect('COALESCE(COUNT(referrals.id), 0)', 'totalReferralCount')
      .leftJoin('userPoint.user', 'user')
      .leftJoin(
        'user_referrals',
        'referrals',
        'referrals.referred_by = userPoint.userId AND referrals.deleted_at IS NULL',
      )
      .groupBy(
        'userPoint.id, userPoint.userId, userPoint.amount, userPoint.updatedAt, user.id, user.username, user.walletAddress, user.avatar, user.email, user.fullName',
      );

    // Get total count before applying pagination - use separate query for better performance
    const countQuery = this.createQueryBuilder('userPoint').where('userPoint.deletedAt IS NULL');
    const total = await countQuery.getCount();

    const result = await queryBuilder
      .orderBy('CAST(userPoint.amount AS DECIMAL)', 'DESC')
      .addOrderBy('userPoint.updatedAt', 'DESC')
      .offset((page - 1) * limit)
      .limit(limit)
      .getRawMany();

    const formattedResult: LeaderboardUserOutputDto[] = result.map(item => ({
      rank: parseInt(item.rank),
      user: {
        id: item.userPoint_user_id,
        username: item.user_username,
        avatar: item.user_avatar,
        address: item.user_wallet_address,
        email: item.user_email,
        fullName: item.user_full_name,
      },
      totalPoint: item.userPoint_amount,
      totalReferralCount: parseInt(item.totalReferralCount) || 0,
    }));

    return new PageDto(formattedResult, new PageMetaDto(total, new PageOptionsDto(page, limit)));
  }

  async getUserRank(
    userId: number,
  ): Promise<{ id: number; rank: number; amount: string; referralCount?: number } | null> {
    const result = await this.createQueryBuilder('userPoint')
      .select(['userPoint.userId', 'userPoint.amount', 'user.walletAddress'])
      .addSelect(`RANK() OVER (ORDER BY CAST(userPoint.amount AS DECIMAL) DESC)`, 'rank')
      .addSelect('COALESCE(COUNT(referrals.id), 0)', 'referralCount')
      .leftJoin('userPoint.user', 'user')
      .leftJoin(
        'user_referrals',
        'referrals',
        'referrals.referred_by = userPoint.userId AND referrals.deleted_at IS NULL',
      )
      .where('userPoint.userId = :userId', { userId })
      .groupBy('userPoint.userId, userPoint.amount, user.walletAddress')
      .getRawOne();

    if (!result) return null;

    return {
      id: result.userPoint_userId,
      rank: parseInt(result.rank),
      amount: result.userPoint_amount,
      referralCount: parseInt(result.referralCount) || 0,
    };
  }

  async getLeaderboardStats(): Promise<LeaderboardStatsOutputDto> {
    // Get all user points ordered by amount descending
    const result = await this.createQueryBuilder('userPoint')
      .select([
        'userPoint.amount',
        'COUNT(userPoint.id) OVER() as total_users',
        'SUM(CAST(userPoint.amount AS DECIMAL)) OVER() as total_points',
      ])
      .where('"userPoint"."deleted_at" IS NULL')
      .orderBy('CAST(userPoint.amount AS DECIMAL)', 'ASC')
      .getRawMany();

    if (!result.length) {
      return {
        totalUsers: 0,
        totalPoints: 0,
        p1Point: 0,
      };
    }

    // Calculate the index for top 1% users
    const p1Index = Math.max(Math.floor(result.length * 0.01), 1);

    return {
      totalUsers: parseInt(result[0].total_users),
      totalPoints: parseInt(result[0].total_points),
      p1Point: parseFloat(result[p1Index - 1]?.userPoint_amount || '0'),
    };
  }
}
