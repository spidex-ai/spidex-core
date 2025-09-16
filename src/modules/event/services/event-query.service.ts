import { EventRankPrizeEntity } from '@database/entities/event-rank-prize.entity';
import { ALL_TOKEN } from '@database/entities/event.entity';
import { EventParticipantRepository } from '@database/repositories/event-participant.repository';
import { EventRankPrizeRepository } from '@database/repositories/event-rank-prize.repository';
import { EventTradeRepository } from '@database/repositories/event-trade.repository';
import { EventRepository } from '@database/repositories/event.repository';
import { UserRepository } from '@database/repositories/user.repository';
import { EventFilterDto, LeaderboardFilterDto } from '@modules/event/dtos/event-request.dto';
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

  async getActiveEvents(filter?: EventFilterDto): Promise<EventInfoResponseDto[]> {
    this.logger.info('Getting events with filter', { filter });

    const events = await this.eventRepository.getEventsWithFilter(filter);
    if (events.length === 0) {
      return [];
    }

    const tokenMetas = await this.getTokenMetadataForEvents(events);
    const tokenMetaMap = keyBy(tokenMetas, 'unit');

    const eventIds = events.map(event => event.id);
    const [participantCountsMap, volumeStatsMap] = await Promise.all([
      this.eventParticipantRepository.getBatchParticipantCounts(eventIds),
      this.eventTradeRepository.getBatchEventVolumeStats(eventIds),
    ]);

    const eventsWithStats = events.map(event => {
      const participantCount = participantCountsMap.get(event.id) || 0;
      const volumeStats = volumeStatsMap.get(event.id) || { totalVolume: '0', totalTrades: 0, uniqueTokens: 0 };

      const tradeToken =
        event.tradeToken && event.tradeToken != ALL_TOKEN
          ? {
              ...tokenMetaMap[event.tradeToken],
              unit: event.tradeToken,
            }
          : { unit: ALL_TOKEN, name: 'All Tokens', logo: null, ticker: null, decimals: 0 };

      const prizeToken =
        event.prizeToken && event.prizeToken != ALL_TOKEN
          ? {
              ...tokenMetaMap[event.prizeToken],
              unit: event.prizeToken,
            }
          : null;

      return {
        ...event,
        tradeToken: tradeToken,
        prizeToken: prizeToken,
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
      relations: ['rankPrizes'],
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const tokenIds: Set<string> = new Set();
    if (event.tradeToken && event.tradeToken != ALL_TOKEN) {
      tokenIds.add(event.tradeToken);
    }
    if (event.prizeToken) {
      tokenIds.add(event.prizeToken);
    }

    const tokenMetas = await this.tokenMetadataService.getTokensMetadata(
      tokenIds,
      new Set(['logo', 'name', 'ticker', 'decimals']),
    );

    const tokenMetaMap = keyBy(tokenMetas, 'unit');
    const stats = await this.getEventBasicStats(eventId);

    const prizeTokenMetas = await this.getPrizeTokenMetadata(event.rankPrizes);
    const prizeTokenMetaMap = keyBy(prizeTokenMetas, 'unit');
    const tradeToken =
      event.tradeToken && event.tradeToken != ALL_TOKEN
        ? {
            ...tokenMetaMap[event.tradeToken],
            unit: event.tradeToken,
          }
        : { unit: ALL_TOKEN, name: 'All Tokens', logo: null, ticker: null, decimals: 0 };

    const prizeToken = event.prizeToken
      ? {
          ...tokenMetaMap[event.prizeToken],
          unit: event.prizeToken,
        }
      : null;

    const eventWithStats = {
      ...event,
      tradeToken: tradeToken,
      prizeToken: prizeToken,
      participantCount: stats.participantCount,
      totalVolumeTraded: stats.totalVolumeTraded,
      totalTrades: stats.totalTrades,
      top3Prizes: this.formatTop3Prizes(event.rankPrizes, prizeTokenMetaMap),
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
    const mapLeadboardByRank = keyBy(leaderboard, 'rank');
    const totalParticipants = await this.eventParticipantRepository.count({
      where: { eventId, deletedAt: IsNull() },
    });

    const prizeTokenMetas = await this.getPrizeTokenMetadata(event.rankPrizes);
    const prizeTokenMetaMap = keyBy(prizeTokenMetas, 'unit');

    const leaderboardWithPrizes: EventLeaderboardEntryDto[] = [];

    for (const rank of event.rankPrizes) {
      for (let r = rank.rankFrom; r <= rank.rankTo; r++) {
        if (!mapLeadboardByRank[r]) {
          leaderboardWithPrizes.push({
            rank: r,
            totalVolume: '0',
            tradeCount: 0,
            userId: null,
            username: null,
            walletAddress: null,
            avatarUrl: null,
            prizeInfo: {
              points: rank.prizePoints.toString(),
              token: {
                ...prizeTokenMetaMap[rank.prizeToken],
                unit: rank.prizeToken,
              },
              tokenAmount: rank.prizeTokenAmount.toString(),
            },
          });
        } else {
          const entry = mapLeadboardByRank[r];
          const entryRes: EventLeaderboardEntryDto = {
            rank: entry.rank,
            totalVolume: entry.total_volume,
            tradeCount: entry.trade_count,
            userId: entry.user_id,
            username: entry.username,
            walletAddress: entry.wallet_address,
            avatarUrl: entry.avatar,
            prizeInfo: {
              points: rank.prizePoints.toString(),
              token: {
                ...prizeTokenMetaMap[rank.prizeToken],
                unit: rank.prizeToken,
              },
              tokenAmount: rank.prizeTokenAmount.toString(),
            },
          };
          leaderboardWithPrizes.push(entryRes);
        }
      }
    }

    return {
      eventId,
      totalParticipants,
      lastUpdated: new Date().toISOString(),
      leaderboard: leaderboardWithPrizes
        .sort((a, b) => a.rank - b.rank)
        .map(entry => plainToClass(EventLeaderboardEntryDto, entry, { excludeExtraneousValues: true })),
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
      if (event.tradeToken && event.tradeToken != ALL_TOKEN) {
        tradingTokenIds.add(event.tradeToken);
      }
      if (event.prizeToken) {
        tradingTokenIds.add(event.prizeToken);
      }
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

  private formatTop3Prizes(prizes: any[], prizeTokenMetaMap: any) {
    const sortedPrizes = prizes.sort((a, b) => a.rankFrom - b.rankFrom);

    const formatPrize = (prize: any) => ({
      unit: prize.prizeToken,
      logo: prizeTokenMetaMap[prize.prizeToken]?.logo || null,
      name: prizeTokenMetaMap[prize.prizeToken]?.name || null,
      ticker: prizeTokenMetaMap[prize.prizeToken]?.ticker || null,
      tokenAmount: prize.prizeTokenAmount?.toString() || '0',
      point: prize.prizePoints?.toString() || '0',
    });

    const findPrizeForRank = (rank: number) => {
      return sortedPrizes.find(p => rank >= p.rankFrom && rank <= p.rankTo);
    };

    return {
      firstPlace: findPrizeForRank(1) ? formatPrize(findPrizeForRank(1)) : null,
      secondPlace: findPrizeForRank(2) ? formatPrize(findPrizeForRank(2)) : null,
      thirdPlace: findPrizeForRank(3) ? formatPrize(findPrizeForRank(3)) : null,
    };
  }
}
