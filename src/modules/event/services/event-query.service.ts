import { EventRankPrizeEntity } from '@database/entities/event-rank-prize.entity';
import { EventParticipantRepository } from '@database/repositories/event-participant.repository';
import { EventRankPrizeRepository } from '@database/repositories/event-rank-prize.repository';
import { EventTradeRepository } from '@database/repositories/event-trade.repository';
import { EventRepository } from '@database/repositories/event.repository';
import { UserRepository } from '@database/repositories/user.repository';
import { LeaderboardFilterDto } from '@modules/event/dtos/event-request.dto';
import {
  EventInfoResponseDto,
  EventLeaderboardEntryDto,
  EventLeaderboardResponseDto,
  UserEventStatsResponseDto,
} from '@modules/event/dtos/event-response.dto';
import { TokenMetaService } from '@modules/token-metadata/token-meta.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { plainToClass } from 'class-transformer';
import { keyBy } from 'lodash';
import { IsNull } from 'typeorm';

@Injectable()
export class EventQueryService {
  private readonly logger = this.loggerService.getLogger(EventQueryService.name);

  constructor(
    private eventRepository: EventRepository,
    private eventParticipantRepository: EventParticipantRepository,
    private eventRankPrizeRepository: EventRankPrizeRepository,
    private eventTradeRepository: EventTradeRepository,
    private userRepository: UserRepository,
    private tokenMetadataService: TokenMetaService,
    private loggerService: LoggerService,
  ) {}

  async getActiveEvents(): Promise<EventInfoResponseDto[]> {
    this.logger.info('Getting active events');

    const activeEvents = await this.eventRepository.getActiveEvents();
    if (activeEvents.length === 0) {
      return [];
    }

    const tokenMetas = await this.getTokenMetadataForEvents(activeEvents);
    const tokenMetaMap = keyBy(tokenMetas, 'unit');

    const eventIds = activeEvents.map(event => event.id);
    const [participantCountsMap, volumeStatsMap] = await Promise.all([
      this.eventParticipantRepository.getBatchParticipantCounts(eventIds),
      this.eventTradeRepository.getBatchEventVolumeStats(eventIds),
    ]);

    const eventsWithStats = activeEvents.map(event => {
      const participantCount = participantCountsMap.get(event.id) || 0;
      const volumeStats = volumeStatsMap.get(event.id) || { totalVolume: '0', totalTrades: 0, uniqueTokens: 0 };

      return {
        ...event,
        tradeToken: {
          ...tokenMetaMap[event.tradeToken],
          unit: event.tradeToken,
        },
        participantCount,
        totalVolumeTraded: volumeStats.totalVolume,
        totalTrades: volumeStats.totalTrades,
      };
    });

    return eventsWithStats.map(event => plainToClass(EventInfoResponseDto, event, { excludeExtraneousValues: true }));
  }

  async getEventById(eventId: number): Promise<EventInfoResponseDto> {
    this.logger.info('Getting event by ID', { eventId });

    const event = await this.eventRepository.findOne({
      where: { id: eventId, deletedAt: IsNull() },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const tokenIds: Set<string> = new Set();
    tokenIds.add(event.tradeToken);
    const tokenMetas = await this.tokenMetadataService.getTokensMetadata(
      tokenIds,
      new Set(['logo', 'name', 'ticker', 'decimals']),
    );

    const tokenMetaMap = keyBy(tokenMetas, 'unit');
    const stats = await this.getEventBasicStats(eventId);

    const eventWithStats = {
      ...event,
      tradeToken: {
        ...tokenMetaMap[event.tradeToken],
        unit: event.tradeToken,
      },
      participantCount: stats.participantCount,
      totalVolumeTraded: stats.totalVolumeTraded,
      totalTrades: stats.totalTrades,
    };

    return plainToClass(EventInfoResponseDto, eventWithStats, { excludeExtraneousValues: true });
  }

  async getEventLeaderboard(eventId: number, filter: LeaderboardFilterDto): Promise<EventLeaderboardResponseDto> {
    this.logger.info('Getting event leaderboard', { eventId, filter });

    const event = await this.eventRepository.findOne({
      where: { id: eventId, deletedAt: IsNull() },
      relations: ['rankPrizes'],
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const leaderboard = await this.eventRepository.getEventLeaderboard(eventId, filter.limit || 50, filter.offset || 0);
    const totalParticipants = await this.eventParticipantRepository.count({
      where: { eventId, deletedAt: IsNull() },
    });

    const prizeTokenMetas = await this.getPrizeTokenMetadata(event.rankPrizes);
    const prizeTokenMetaMap = keyBy(prizeTokenMetas, 'unit');

    const leaderboardWithPrizes = leaderboard.map(entry => {
      const prize = event.rankPrizes.find(p => entry.rank >= p.rankFrom && entry.rank <= p.rankTo);

      const entryRes: EventLeaderboardEntryDto = {
        rank: entry.rank,
        totalVolume: entry.total_volume,
        tradeCount: entry.trade_count,
        userId: entry.user_id,
        username: entry.username,
        walletAddress: entry.wallet_address,
        avatarUrl: entry.avatar,
        prizeInfo: {
          points: prize.prizePoints.toString(),
          token: {
            ...prizeTokenMetaMap[prize.prizeToken],
            unit: prize.prizeToken,
          },
          tokenAmount: prize.prizeTokenAmount.toString(),
        },
      };
      return entryRes;
    });

    return {
      eventId,
      totalParticipants,
      lastUpdated: new Date().toISOString(),
      leaderboard: leaderboardWithPrizes.map(entry =>
        plainToClass(EventLeaderboardEntryDto, entry, { excludeExtraneousValues: true }),
      ),
    };
  }

  async getUserEventStats(eventId: number, userId: number): Promise<UserEventStatsResponseDto> {
    this.logger.info('Getting user event stats', { eventId, userId });

    const event = await this.eventRepository.findOne({
      where: { id: eventId, deletedAt: IsNull() },
      relations: ['rankPrizes'],
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const participant = await this.eventParticipantRepository.findByEventAndUser(eventId, userId);
    console.log({ participant });
    if (!participant) {
      return await this.createNonParticipantStats(eventId, userId);
    }

    const rank = await this.eventParticipantRepository.getParticipantRank(eventId, userId);
    const prizeInfo = rank ? this.calculatePrizeForRank(rank, event.rankPrizes) : null;

    const prizeTokenMetas = await this.getPrizeTokenMetadata(event.rankPrizes);
    const prizeTokenMetaMap = keyBy(prizeTokenMetas, 'unit');

    return plainToClass(
      UserEventStatsResponseDto,
      {
        eventId,
        userId,
        username: participant.user.username,
        walletAddress: participant.user.walletAddress,
        avatarUrl: participant.user.avatar,
        totalVolume: participant.totalVolume.toString(),
        tradeCount: participant.tradeCount,
        rank,
        isParticipating: true,
        joinedAt: participant.joinedAt,
        lastTradeAt: participant.lastTradeAt,
        prizeInfo: prizeInfo
          ? {
              points: prizeInfo.points?.toString(),
              token: {
                ...prizeTokenMetaMap[prizeInfo.token],
                unit: prizeInfo.token,
              },
              tokenAmount: prizeInfo.tokenAmount?.toString(),
              claimed: participant.prizeClaimed,
            }
          : null,
      },
      { excludeExtraneousValues: true },
    );
  }

  // ==================== Private Helper Methods ====================

  private async getTokenMetadataForEvents(activeEvents: any[]) {
    const tradingTokenIds: Set<string> = new Set();
    activeEvents.forEach(event => {
      tradingTokenIds.add(event.tradeToken);
    });

    return await this.tokenMetadataService.getTokensMetadata(
      tradingTokenIds,
      new Set(['logo', 'name', 'ticker', 'decimals']),
    );
  }

  private async getPrizeTokenMetadata(rankPrizes: EventRankPrizeEntity[]) {
    const prizeTokenIds = new Set(rankPrizes.map(prize => prize.prizeToken));
    return await this.tokenMetadataService.getTokensMetadata(
      prizeTokenIds,
      new Set(['logo', 'name', 'ticker', 'decimals']),
    );
  }

  private async getEventBasicStats(eventId: number) {
    const participantCount = await this.eventParticipantRepository.count({
      where: { eventId, deletedAt: IsNull() },
    });

    const volumeStats = await this.eventTradeRepository.getEventVolumeStats(eventId);

    return {
      participantCount,
      totalVolumeTraded: volumeStats.totalVolume,
      totalTrades: volumeStats.totalTrades,
    };
  }

  private calculatePrizeForRank(rank: number, rankPrizes: EventRankPrizeEntity[]) {
    const prize = rankPrizes.find(p => rank >= p.rankFrom && rank <= p.rankTo);
    if (!prize) return null;

    return {
      points: prize.prizePoints?.toString(),
      token: prize.prizeToken,
      tokenAmount: prize.prizeTokenAmount?.toString(),
    };
  }

  private async createNonParticipantStats(eventId: number, userId: number): Promise<UserEventStatsResponseDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    return {
      eventId,
      userId,
      username: user?.username || null,
      walletAddress: user?.walletAddress || null,
      avatarUrl: user?.avatar || null,
      totalVolume: '0',
      tradeCount: 0,
      rank: -1,
      isParticipating: false,
      joinedAt: null,
      lastTradeAt: null,
      prizeInfo: null,
    };
  }
}
