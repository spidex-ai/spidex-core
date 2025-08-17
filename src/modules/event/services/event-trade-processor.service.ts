import { EventParticipantRepository } from '@database/repositories/event-participant.repository';
import { EventTradeRepository } from '@database/repositories/event-trade.repository';
import { EventRepository } from '@database/repositories/event.repository';
import { EEventTradeType, ERankChangeType } from '@modules/event/event.constant';
import { IEventRelatedTradeMessage } from '@modules/event/interfaces/event-message';
import {
  EventId,
  IRankChange,
  ITokenTradeInfo,
  ITradeProcessingResult,
  UserId,
  VolumeAmount,
} from '@modules/event/interfaces/event-types';
import { Injectable } from '@nestjs/common';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { Decimal } from 'decimal.js';
import { Transactional } from 'typeorm-transactional';

@Injectable()
export class EventTradeProcessorService {
  private readonly logger = this.loggerService.getLogger(EventTradeProcessorService.name);

  constructor(
    private eventRepository: EventRepository,
    private eventParticipantRepository: EventParticipantRepository,
    private eventTradeRepository: EventTradeRepository,
    private loggerService: LoggerService,
  ) {}

  async handleTradeCompletedForEvent(data: IEventRelatedTradeMessage): Promise<void> {
    this.logger.info('Processing trade for events', {
      userId: data.userId,
      txHash: data.txHash,
      volumeUsd: data.usdVolume,
    });

    if (!this.validateTradeData(data)) {
      return;
    }

    try {
      const activeEvents = await this.findActiveEventsForTrade(data);

      if (activeEvents.length === 0) {
        this.logger.info('No active events found for tokens', {
          tokenA: data.tokenA,
          tokenB: data.tokenB,
        });
        return;
      }

      await this.processTradeForAllEvents(activeEvents, data);
    } catch (error) {
      this.logger.error('Error processing trade for events', {
        error: error.message,
        data,
      });
      throw error;
    }
  }

  @Transactional()
  async processTradeForEvent(eventId: EventId, tradeData: IEventRelatedTradeMessage): Promise<ITradeProcessingResult> {
    this.logger.info('Processing trade for specific event', {
      eventId,
      userId: tradeData.userId,
      txHash: tradeData.txHash,
    });

    try {
      // Check for duplicates
      if (await this.isDuplicateTrade(tradeData.transactionId, eventId)) {
        return this.createDuplicateTradeResult(eventId, tradeData);
      }

      // Get or create participant
      const participant = await this.getOrCreateParticipant(eventId, tradeData.userId);
      const isNewParticipant = !await this.eventParticipantRepository.findByEventAndUser(eventId, tradeData.userId);

      // Validate trade against event
      const tradeInfo = await this.validateTradeForEvent(eventId, tradeData);
      if (!tradeInfo) {
        return this.createInvalidTradeResult(eventId, tradeData);
      }

      // Create trade record
      const savedEventTrade = await this.createEventTradeRecord(eventId, participant.id, tradeData, tradeInfo);

      // Update rankings
      const rankChange = await this.updateParticipantRanking(
        eventId,
        tradeData.userId,
        participant.rank,
        tradeData.usdVolume,
      );

      this.logger.info('Successfully processed trade for event', {
        eventId,
        participantId: participant.id,
        tradeId: savedEventTrade.id,
        volumeUsd: tradeData.usdVolume,
        newParticipant: isNewParticipant,
      });

      return {
        success: true,
        eventId,
        participantId: participant.id,
        tradeId: savedEventTrade.id,
        volumeProcessed: tradeData.usdVolume,
        rankChange,
        newParticipant: isNewParticipant,
      };
    } catch (error) {
      this.logger.error('Failed to process trade for event', {
        eventId,
        userId: tradeData.userId,
        error: error.message,
        txHash: tradeData.txHash,
      });

      throw new Error(`Failed to process trade for event ${eventId}: ${error.message}`);
    }
  }

  async getEventTradeStats(eventId: number): Promise<{
    totalVolume: string;
    totalTrades: number;
    uniqueParticipants: number;
    topTokens: Array<{ token: string; volume: string; trades: number }>;
  }> {
    const stats = await this.eventTradeRepository.getEventVolumeStats(eventId);

    const participantCount = await this.eventParticipantRepository.count({
      where: { eventId },
    });

    const topTokensQuery = `
      SELECT 
        token_traded as token,
        SUM(volume_usd) as volume,
        COUNT(*) as trades
      FROM event_trades
      WHERE event_id = $1 AND deleted_at IS NULL
      GROUP BY token_traded
      ORDER BY volume DESC
      LIMIT 5
    `;

    const topTokens = await this.eventTradeRepository.query(topTokensQuery, [eventId]);

    return {
      totalVolume: stats.totalVolume,
      totalTrades: stats.totalTrades,
      uniqueParticipants: participantCount,
      topTokens: topTokens.map((token: any) => ({
        token: token.token,
        volume: token.volume,
        trades: parseInt(token.trades),
      })),
    };
  }

  // ==================== Private Helper Methods ====================

  private validateTradeData(data: IEventRelatedTradeMessage): boolean {
    if (!data.userId || !data.txHash || !data.usdVolume) {
      this.logger.warn('Invalid trade data - missing required fields', {
        userId: data.userId,
        txHash: data.txHash,
        volumeUsd: data.usdVolume,
      });
      return false;
    }

    const hasValidTokenA = data.tokenA && data.tokenA.trim() !== '';
    const hasValidTokenB = data.tokenB && data.tokenB.trim() !== '';

    if (!hasValidTokenA && !hasValidTokenB) {
      this.logger.warn('Invalid trade data - both tokens are empty', {
        tokenA: data.tokenA,
        tokenB: data.tokenB,
        txHash: data.txHash,
      });
      return false;
    }

    return true;
  }

  private async findActiveEventsForTrade(data: IEventRelatedTradeMessage) {
    return await this.eventRepository.getActiveEventsForTokens(
      data.tokenA || '',
      data.tokenB || '',
      data.timestamp,
    );
  }

  private async processTradeForAllEvents(activeEvents: any[], data: IEventRelatedTradeMessage) {
    const eventProcessingPromises = activeEvents.map(async (event) => {
      try {
        await this.processTradeForEvent(event.id, data);
      } catch (error) {
        this.logger.error('Failed to process trade for individual event', {
          eventId: event.id,
          userId: data.userId,
          txHash: data.txHash,
          error: error.message,
        });
      }
    });

    await Promise.allSettled(eventProcessingPromises);
  }

  private async isDuplicateTrade(transactionId: number, eventId: number): Promise<boolean> {
    try {
      const existingTrade = await this.eventTradeRepository.checkDuplicateTrade(transactionId, eventId);
      if (existingTrade) {
        this.logger.warn('Trade already processed for event', { eventId, transactionId });
        return true;
      }
    } catch (error) {
      this.logger.error('Error checking duplicate trade', {
        eventId,
        transactionId,
        error: error.message,
      });
    }
    return false;
  }

  private createDuplicateTradeResult(eventId: number, tradeData: IEventRelatedTradeMessage): ITradeProcessingResult {
    return {
      success: true,
      eventId,
      participantId: 0,
      tradeId: 0,
      volumeProcessed: tradeData.usdVolume,
      newParticipant: false,
    };
  }

  private async getOrCreateParticipant(eventId: EventId, userId: UserId) {
    let participant = await this.eventParticipantRepository.findByEventAndUser(eventId, userId);

    if (!participant) {
      participant = await this.createEventParticipant(eventId, userId);
      this.logger.info('Auto-joined user to event', {
        eventId,
        userId,
        participantId: participant.id,
      });
    }

    return participant;
  }

  private async createEventParticipant(eventId: EventId, userId: UserId): Promise<any> {
    const participant = this.eventParticipantRepository.create({
      eventId,
      userId,
      totalVolume: new Decimal(0).toString(),
      tradeCount: 0,
      joinedAt: new Date(),
      prizeClaimed: false,
    });

    return await this.eventParticipantRepository.save(participant);
  }

  private async validateTradeForEvent(eventId: number, tradeData: IEventRelatedTradeMessage): Promise<ITokenTradeInfo | null> {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error(`Event ${eventId} not found`);
    }

    return this.determineTradeType(event.tradeToken, tradeData);
  }

  private determineTradeType(eventToken: string, tradeData: IEventRelatedTradeMessage): ITokenTradeInfo | null {
    if (!eventToken || eventToken.trim() === '') {
      return null;
    }

    // Check if tokenA is an event token (user is selling event token)
    if (eventToken === tradeData.tokenA && tradeData.tokenA && tradeData.tokenA.trim() !== '') {
      return {
        tokenAddress: tradeData.tokenA,
        tradeType: EEventTradeType.SELL,
        tokenAmount: new Decimal(tradeData.tokenAAmount || '0').toString(),
        volumeUsd: new Decimal(tradeData.usdVolume || '0').toString(),
      };
    }

    // Check if tokenB is an event token (user is buying event token)
    if (eventToken === tradeData.tokenB && tradeData.tokenB && tradeData.tokenB.trim() !== '') {
      return {
        tokenAddress: tradeData.tokenB,
        tradeType: EEventTradeType.BUY,
        tokenAmount: new Decimal(tradeData.tokenBAmount || '0').toString(),
        volumeUsd: new Decimal(tradeData.usdVolume || '0').toString(),
      };
    }

    return null;
  }

  private createInvalidTradeResult(eventId: number, tradeData: IEventRelatedTradeMessage): ITradeProcessingResult {
    this.logger.warn('No qualifying trade found for event', {
      eventId,
      tradeTokenA: tradeData.tokenA,
      tradeTokenB: tradeData.tokenB,
      txHash: tradeData.txHash,
    });

    return {
      success: false,
      eventId,
      participantId: 0,
      tradeId: 0,
      volumeProcessed: tradeData.usdVolume,
      newParticipant: false,
      errors: [`No qualifying trade found for tokens ${tradeData.tokenA} and ${tradeData.tokenB}`],
    };
  }

  private async createEventTradeRecord(
    eventId: number,
    participantId: number,
    tradeData: IEventRelatedTradeMessage,
    tradeInfo: ITokenTradeInfo,
  ) {
    try {
      const eventTrade = this.eventTradeRepository.create({
        eventId,
        participantId,
        swapTransactionId: tradeData.transactionId,
        volumeUsd: new Decimal(tradeData.usdVolume || '0').toString(),
        tokenTraded: tradeInfo.tokenAddress,
        tokenAmount: tradeInfo.tokenAmount,
        tradeType: tradeInfo.tradeType,
        recordedAt: tradeData.timestamp,
      });

      const savedEventTrade = await this.eventTradeRepository.save(eventTrade);

      this.logger.info('Event trade record created successfully', {
        eventId,
        tradeId: savedEventTrade.id,
        tokenTraded: tradeInfo.tokenAddress,
        tokenAmount: tradeInfo.tokenAmount.toString(),
        volumeUsd: tradeData.usdVolume.toString(),
      });

      return savedEventTrade;
    } catch (dbError) {
      this.logger.error('Failed to create event trade record', {
        eventId,
        userId: tradeData.userId,
        tokenTraded: tradeInfo.tokenAddress,
        tokenAmount: tradeInfo.tokenAmount.toString(),
        volumeUsd: tradeData.usdVolume,
        error: dbError.message,
      });

      throw new Error(`Failed to create event trade record: ${dbError.message}`);
    }
  }

  private async updateParticipantRanking(
    eventId: EventId,
    userId: UserId,
    oldRank: number | null,
    volumeChange: VolumeAmount,
  ): Promise<IRankChange | undefined> {
    try {
      // Update participant totals
      const participant = await this.eventParticipantRepository.findByEventAndUser(eventId, userId);
      if (participant) {
        await this.eventParticipantRepository.updateParticipantTotals(participant.id);
      }

      // Update participant rank
      await this.eventRepository.updateParticipantRank(eventId);

      // Get new rank after updating
      const updatedParticipant = await this.eventParticipantRepository.findByEventAndUser(eventId, userId);
      const newRank = updatedParticipant?.rank;

      // Track rank change if ranks differ
      if (oldRank !== newRank && newRank) {
        const rankChange: IRankChange = {
          userId,
          eventId,
          oldRank,
          newRank,
          changeType: this.determineRankChangeType(oldRank, newRank),
          volumeChange: typeof volumeChange === 'string' ? volumeChange : volumeChange.toString(),
          timestamp: new Date(),
        };

        this.logger.info('Participant rank changed', rankChange);
        return rankChange;
      }
    } catch (error) {
      this.logger.error('Failed to update participant ranking', {
        eventId,
        userId,
        error: error.message,
      });
    }

    return undefined;
  }

  private determineRankChangeType(oldRank: number | null, newRank: number): ERankChangeType {
    if (oldRank === null) {
      return ERankChangeType.NEW_ENTRY;
    }

    if (newRank < oldRank) {
      return ERankChangeType.UP;
    } else if (newRank > oldRank) {
      return ERankChangeType.DOWN;
    } else {
      return ERankChangeType.NO_CHANGE;
    }
  }
}