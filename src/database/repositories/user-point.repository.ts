import { BaseRepository } from '@database/common/base.repository';
import { UserPointEntity } from '@database/entities/user-point.entity';
import {
  EUserPointLeaderboardOrderBy,
  LeaderboardStatsOutputDto,
  LeaderboardUserOutputDto,
  UserPointLeaderboardQueryDto,
} from '@modules/user-point/dtos/user-point-leaderboard.dto';
import { EUserPointRankOrderBy, UserPointRankQueryDto } from '@modules/user-point/dtos/user-point-rank.dto';
import { EntityRepository } from 'nestjs-typeorm-custom-repository';

@EntityRepository(UserPointEntity)
export class UserPointRepository extends BaseRepository<UserPointEntity> {
  async getLeaderboard(query: UserPointLeaderboardQueryDto): Promise<LeaderboardUserOutputDto[]> {
    const MAX_LIMIT = 20;

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
      .addSelect(
        `RANK() OVER (ORDER BY COALESCE(COUNT(referrals.id), 0) DESC, 
          CAST(userPoint.amount AS DECIMAL) DESC, userPoint.updatedAt DESC)`,
        'referralRank',
      )
      .addSelect('COALESCE(COUNT(referrals.id), 0)', 'total_referral_count')
      .leftJoin('userPoint.user', 'user')
      .leftJoin(
        'user_referrals',
        'referrals',
        'referrals.referred_by = userPoint.userId AND referrals.deleted_at IS NULL',
      )
      .having('userPoint.amount > 0')
      .orHaving('COALESCE(COUNT(referrals.id), 0) > 0')
      .groupBy(
        'userPoint.id, userPoint.userId, userPoint.amount, userPoint.updatedAt, user.id, user.username, user.walletAddress, user.avatar, user.email, user.fullName',
      );

    // Get total count before applying pagination - use separate query for better performance

    if (query.orderBy === EUserPointLeaderboardOrderBy.REFERRAL) {
      queryBuilder
        .orderBy('total_referral_count', 'DESC')
        .addOrderBy('CAST(userPoint.amount AS DECIMAL)', 'DESC')
        .addOrderBy('userPoint.updatedAt', 'DESC');
    } else {
      queryBuilder.orderBy('CAST(userPoint.amount AS DECIMAL)', 'DESC').addOrderBy('userPoint.updatedAt', 'DESC');
    }

    const result = await queryBuilder.limit(MAX_LIMIT).getRawMany();

    const formattedResult: LeaderboardUserOutputDto[] = result.map(item => ({
      rank: query.orderBy === EUserPointLeaderboardOrderBy.REFERRAL ? parseInt(item.referralRank) : parseInt(item.rank),
      user: {
        id: item.userPoint_user_id,
        username: item.user_username,
        avatar: item.user_avatar,
        address: item.user_wallet_address,
        email: item.user_email,
        fullName: item.user_full_name,
      },
      totalPoint: item.userPoint_amount,
      totalReferralCount: parseInt(item.total_referral_count) || 0,
    }));

    return formattedResult;
  }

  async getUserRank(
    userId: number,
    options: UserPointRankQueryDto,
  ): Promise<{ id: number; rank: number; amount: string; referralCount?: number } | null> {
    // Use a subquery to calculate ranks for all users, then filter for the specific user
    const { orderBy } = options;
    let rankQuery = `
      SELECT
        up.user_id,
        up.amount,
        RANK() OVER (ORDER BY CAST(up.amount AS DECIMAL) DESC) as rank,
        COALESCE(COUNT(ur.id), 0) as referral_count
      FROM user_points up
      LEFT JOIN user_referrals ur ON ur.referred_by = up.user_id AND ur.deleted_at IS NULL
      GROUP BY up.user_id, up.amount
    `;

    if (orderBy === EUserPointRankOrderBy.REFERRAL) {
      rankQuery = `
        SELECT
          up.user_id,
          up.amount,
          RANK() OVER (ORDER BY COALESCE(COUNT(ur.id), 0) DESC, CAST(up.amount AS DECIMAL) DESC) as rank,
          COALESCE(COUNT(ur.id), 0) as referral_count
        FROM user_points up
        LEFT JOIN user_referrals ur ON ur.referred_by = up.user_id AND ur.deleted_at IS NULL
        GROUP BY up.user_id, up.amount
      `;
    }

    const result = await this.query(
      `
      SELECT
        ranked_users.user_id as "userId",
        ranked_users.amount,
        ranked_users.rank,
        ranked_users.referral_count as "referralCount"
      FROM (
        ${rankQuery}
      ) ranked_users
      WHERE ranked_users.user_id = $1
    `,
      [userId],
    );

    if (!result || result.length === 0) return null;

    const userRank = result[0];
    return {
      id: parseInt(userRank.userId),
      rank: parseInt(userRank.rank),
      amount: userRank.amount,
      referralCount: parseInt(userRank.referralCount) || 0,
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
