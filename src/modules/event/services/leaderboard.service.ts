import { EEventStatus } from '@database/entities/event.entity';
import { EventParticipantRepository } from '@database/repositories/event-participant.repository';
import { EventTradeRepository } from '@database/repositories/event-trade.repository';
import { EventRepository } from '@database/repositories/event.repository';
import { LeaderboardFilterDto } from '@modules/event/dtos/event-request.dto';
import {
  EventLeaderboardEntryDto,
  EventLeaderboardResponseDto,
  GlobalLeaderboardResponseDto,
  LeaderboardStatsDto,
} from '@modules/event/dtos/event-response.dto';
import { EVENT_PATTERNS } from '@modules/event/interfaces/event-pattern';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RabbitMQService } from '@shared/modules/rabbitmq/rabbitmq.service';
import { Cache } from 'cache-manager';
import { plainToClass } from 'class-transformer';
import { IsNull } from 'typeorm';

export interface CachedLeaderboard {
  leaderboard: EventLeaderboardEntryDto[];
  lastUpdated: string;
  totalParticipants: number;
}

export interface LeaderboardRankChange {
  userId: number;
  eventId: number;
  oldRank: number | null;
  newRank: number;
  volumeChange: string;
}

@Injectable()
export class LeaderboardService {
  private readonly logger = new Logger(LeaderboardService.name);
  private readonly LEADERBOARD_CACHE_PREFIX = 'event_leaderboard';
  private readonly GLOBAL_LEADERBOARD_CACHE_KEY = 'global_leaderboard';
  private readonly LEADERBOARD_STATS_CACHE_PREFIX = 'leaderboard_stats';
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(
    private eventRepository: EventRepository,
    private eventParticipantRepository: EventParticipantRepository,
    private eventTradeRepository: EventTradeRepository,
    private rabbitMQService: RabbitMQService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getEventLeaderboard(
    eventId: number,
    filter: LeaderboardFilterDto,
    useCache: boolean = false,
  ): Promise<EventLeaderboardResponseDto> {
    const cacheKey = `${this.LEADERBOARD_CACHE_PREFIX}:${eventId}:${filter.limit || 50}:${filter.offset || 0}`;

    // if (useCache) {
    //   const cachedData = await this.getCachedLeaderboard(cacheKey);
    //   if (cachedData) {
    //     this.logger.debug(`Returning cached leaderboard for event ${eventId}`);
    //     return {
    //       eventId,
    //       totalParticipants: cachedData.totalParticipants,
    //       lastUpdated: cachedData.lastUpdated,
    //       leaderboard: cachedData.leaderboard,
    //     };
    //   }
    // }

    // Get fresh data from database
    const event = await this.eventRepository.findOne({
      where: { id: eventId, deletedAt: IsNull() },
      relations: ['rankPrizes'],
    });

    if (!event) {
      throw new Error('Event not found');
    }

    const leaderboard = await this.eventRepository.getEventLeaderboard(eventId, filter.limit || 50, filter.offset || 0);
    const totalParticipants = await this.eventParticipantRepository.count({
      where: { eventId, deletedAt: IsNull() },
    });

    // Add prize information to leaderboard entries
    const leaderboardWithPrizes = leaderboard.map(entry => {
      const prize = event.rankPrizes.find(p => entry.rank >= p.rankFrom && entry.rank <= p.rankTo);

      return {
        userId: entry.user_id,
        walletAddress: entry.wallet_address,
        username: entry.username,
        avatarUrl: entry.avatar,
        totalVolume: entry.total_volume,
        tradeCount: entry.trade_count,
        rank: entry.rank,
        prizeInfo: prize
          ? {
              points: prize.prizePoints?.toString(),
              token: prize.prizeToken,
              tokenAmount: prize.prizeTokenAmount?.toString(),
            }
          : undefined,
      };
    });

    const result: EventLeaderboardResponseDto = {
      eventId,
      totalParticipants,
      lastUpdated: new Date().toISOString(),
      leaderboard: leaderboardWithPrizes.map(entry =>
        plainToClass(EventLeaderboardEntryDto, entry, { excludeExtraneousValues: true }),
      ),
    };

    // Cache the result
    if (useCache) {
      await this.cacheLeaderboard(cacheKey, {
        leaderboard: result.leaderboard,
        lastUpdated: result.lastUpdated,
        totalParticipants: result.totalParticipants,
      });
    }

    return result;
  }

  async getGlobalLeaderboard(
    limit: number = 100,
    offset: number = 0,
    useCache: boolean = true,
  ): Promise<GlobalLeaderboardResponseDto> {
    const cacheKey = `${this.GLOBAL_LEADERBOARD_CACHE_KEY}:${limit}:${offset}`;

    if (useCache) {
      const cachedData = await this.getCachedLeaderboard(cacheKey);
      if (cachedData) {
        this.logger.debug('Returning cached global leaderboard');
        return {
          totalParticipants: cachedData.totalParticipants,
          lastUpdated: cachedData.lastUpdated,
          leaderboard: cachedData.leaderboard,
        };
      }
    }

    // Get global leaderboard across all events
    const globalLeaderboardQuery = `
      SELECT 
        u.id as user_id,
        u.wallet_address,
        u.username,
        u.avatar,
        SUM(ep.total_volume) as total_volume,
        SUM(ep.trade_count) as trade_count,
        COUNT(DISTINCT ep.event_id) as events_participated,
        RANK() OVER (ORDER BY SUM(ep.total_volume) DESC) as rank
      FROM event_participants ep
      LEFT JOIN users u ON u.id = ep.user_id
      LEFT JOIN events e ON e.id = ep.event_id
      WHERE ep.deleted_at IS NULL
        AND e.deleted_at IS NULL
        AND ep.total_volume > 0
      GROUP BY u.id, u.wallet_address, u.username, u.avatar
      ORDER BY total_volume DESC
      LIMIT $1 OFFSET $2
    `;

    const totalParticipantsQuery = `
      SELECT COUNT(DISTINCT ep.user_id) as total
      FROM event_participants ep
      LEFT JOIN users u ON u.id = ep.user_id
      LEFT JOIN events e ON e.id = ep.event_id
      WHERE ep.deleted_at IS NULL
        AND e.deleted_at IS NULL
        AND ep.total_volume > 0
    `;

    const [leaderboard, totalResult] = await Promise.all([
      this.eventRepository.query(globalLeaderboardQuery, [limit, offset]),
      this.eventRepository.query(totalParticipantsQuery),
    ]);

    const leaderboardEntries = leaderboard.map((entry: any) =>
      plainToClass(
        EventLeaderboardEntryDto,
        {
          userId: entry.user_id,
          walletAddress: entry.wallet_address,
          username: entry.username,
          avatarUrl: entry.avatar,
          totalVolume: entry.total_volume,
          tradeCount: parseInt(entry.trade_count),
          rank: parseInt(entry.rank),
          eventsParticipated: parseInt(entry.events_participated),
        },
        { excludeExtraneousValues: true },
      ),
    );

    const result: GlobalLeaderboardResponseDto = {
      totalParticipants: parseInt(totalResult[0].total),
      lastUpdated: new Date().toISOString(),
      leaderboard: leaderboardEntries,
    };

    // Cache the result
    if (useCache) {
      await this.cacheLeaderboard(cacheKey, {
        leaderboard: result.leaderboard,
        lastUpdated: result.lastUpdated,
        totalParticipants: result.totalParticipants,
      });
    }

    return result;
  }

  async getLeaderboardStats(eventId?: number): Promise<LeaderboardStatsDto> {
    const cacheKey = eventId
      ? `${this.LEADERBOARD_STATS_CACHE_PREFIX}:${eventId}`
      : `${this.LEADERBOARD_STATS_CACHE_PREFIX}:global`;

    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached as LeaderboardStatsDto;
    }

    let stats: LeaderboardStatsDto;

    if (eventId) {
      // Event-specific stats
      const eventStats = await this.eventRepository.getEventAnalytics(eventId);
      stats = {
        totalParticipants: eventStats.totalParticipants,
        totalVolumeTraded: eventStats.totalVolumeTraded,
        totalTrades: eventStats.totalTrades,
        averageVolumePerParticipant: eventStats.averageVolumePerParticipant,
        activeEvents: 1,
        lastUpdated: new Date().toISOString(),
      };
    } else {
      // Global stats
      const globalStatsQuery = `
        SELECT 
          COUNT(DISTINCT ep.user_id) as total_participants,
          COUNT(DISTINCT ep.event_id) as active_events,
          COALESCE(SUM(ep.total_volume), 0) as total_volume_traded,
          COALESCE(SUM(ep.trade_count), 0) as total_trades,
          COALESCE(AVG(ep.total_volume), 0) as average_volume_per_participant
        FROM event_participants ep
        LEFT JOIN events e ON e.id = ep.event_id
        WHERE ep.deleted_at IS NULL
          AND e.deleted_at IS NULL
          AND e.status = $1
      `;

      const [globalStats] = await this.eventRepository.query(globalStatsQuery, [EEventStatus.ACTIVE]);

      stats = {
        totalParticipants: parseInt(globalStats.total_participants),
        totalVolumeTraded: globalStats.total_volume_traded,
        totalTrades: parseInt(globalStats.total_trades),
        averageVolumePerParticipant: globalStats.average_volume_per_participant,
        activeEvents: parseInt(globalStats.active_events),
        lastUpdated: new Date().toISOString(),
      };
    }

    // Cache for 2 minutes (120000 milliseconds)
    await this.cacheManager.set(cacheKey, stats, 120000);
    return stats;
  }

  async invalidateEventLeaderboardCache(eventId: number): Promise<void> {
    this.logger.debug(`Invalidating leaderboard cache for event ${eventId}`);

    // Invalidate common leaderboard cache keys for this event
    const keysToInvalidate = [
      `${this.LEADERBOARD_CACHE_PREFIX}:${eventId}:50:0`, // Default page 1
      `${this.LEADERBOARD_CACHE_PREFIX}:${eventId}:100:0`, // Full first page
      `${this.LEADERBOARD_CACHE_PREFIX}:${eventId}:25:0`, // Quarter page
      `${this.LEADERBOARD_STATS_CACHE_PREFIX}:${eventId}`, // Stats cache
    ];

    const deletePromises = keysToInvalidate.map(key =>
      this.cacheManager.del(key).catch(error => {
        this.logger.warn(`Failed to delete cache key ${key}`, error.message);
      }),
    );

    await Promise.allSettled(deletePromises);
    this.logger.debug(`Invalidated leaderboard cache for event ${eventId}`);
  }

  async invalidateGlobalLeaderboardCache(): Promise<void> {
    this.logger.debug('Invalidating global leaderboard cache');

    // Invalidate common global leaderboard cache keys
    const keysToInvalidate = [
      `${this.GLOBAL_LEADERBOARD_CACHE_KEY}:100:0`, // Default global page
      `${this.GLOBAL_LEADERBOARD_CACHE_KEY}:50:0`, // Half page
      `${this.GLOBAL_LEADERBOARD_CACHE_KEY}:200:0`, // Double page
      `${this.LEADERBOARD_STATS_CACHE_PREFIX}:global`, // Global stats
    ];

    const deletePromises = keysToInvalidate.map(key =>
      this.cacheManager.del(key).catch(error => {
        this.logger.warn(`Failed to delete cache key ${key}`, error.message);
      }),
    );

    await Promise.allSettled(deletePromises);
    this.logger.debug('Global leaderboard cache invalidated');
  }

  async trackRankChange(
    eventId: number,
    userId: number,
    oldRank: number | null,
    newRank: number,
    volumeChange: string,
  ): Promise<void> {
    const rankChange: LeaderboardRankChange = {
      eventId,
      userId,
      oldRank,
      newRank,
      volumeChange,
    };

    // Emit rank change event
    await this.rabbitMQService.emitToCore(EVENT_PATTERNS.LEADERBOARD_RANK_CHANGED, rankChange);

    this.logger.debug('Rank change tracked', rankChange);
  }

  // Scheduled task to update leaderboards every 5 minutes
  @Cron(CronExpression.EVERY_5_MINUTES)
  async updateActiveEventRankings(): Promise<void> {
    this.logger.debug('Starting scheduled leaderboard rankings update');

    try {
      const activeEvents = await this.eventRepository.getActiveEvents();

      for (const event of activeEvents) {
        await this.eventRepository.updateParticipantRank(event.id);
        await this.invalidateEventLeaderboardCache(event.id);

        this.logger.debug(`Updated rankings for event ${event.id}: ${event.name}`);
      }

      // Also invalidate global cache
      await this.invalidateGlobalLeaderboardCache();

      this.logger.debug(`Completed scheduled update for ${activeEvents.length} active events`);
    } catch (error) {
      this.logger.error('Failed to update leaderboard rankings', error.stack);
    }
  }

  // Scheduled task to refresh leaderboard cache every 2 minutes
  @Cron('0 */2 * * * *')
  async refreshLeaderboardCache(): Promise<void> {
    this.logger.debug('Refreshing leaderboard cache');

    try {
      const activeEvents = await this.eventRepository.getActiveEvents();

      // Pre-warm cache for active events (top 50 entries)
      const refreshPromises: Promise<any>[] = activeEvents.map(event =>
        this.getEventLeaderboard(event.id, { limit: 50, offset: 0 }, false).catch(error => {
          this.logger.warn(`Failed to refresh cache for event ${event.id}`, error.message);
        }),
      );

      // Also refresh global leaderboard
      refreshPromises.push(
        this.getGlobalLeaderboard(100, 0, false).catch(error => {
          this.logger.warn('Failed to refresh global leaderboard cache', error.message);
        }),
      );

      await Promise.allSettled(refreshPromises);

      this.logger.debug('Leaderboard cache refresh completed');
    } catch (error) {
      this.logger.error('Failed to refresh leaderboard cache', error.stack);
    }
  }

  private async getCachedLeaderboard(cacheKey: string): Promise<CachedLeaderboard | null> {
    try {
      const cached = await this.cacheManager.get(cacheKey);
      return cached as CachedLeaderboard | null;
    } catch (error) {
      this.logger.warn(`Failed to get cached leaderboard for key ${cacheKey}`, error.message);
      return null;
    }
  }

  private async cacheLeaderboard(cacheKey: string, data: CachedLeaderboard): Promise<void> {
    try {
      // Convert TTL from seconds to milliseconds
      await this.cacheManager.set(cacheKey, data, this.CACHE_TTL * 1000);
    } catch (error) {
      this.logger.warn(`Failed to cache leaderboard for key ${cacheKey}`, error.message);
    }
  }
}
