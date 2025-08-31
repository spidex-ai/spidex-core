import { EEventStatus } from '@database/entities/event.entity';
import { SwapTransactionEntity } from '@database/entities/swap-transaction.entity';
import { EventFilterDto, LeaderboardFilterDto } from '@modules/event/dtos/event-request.dto';
import {
  EventInfoResponseDto,
  EventLeaderboardResponseDto,
  UserEventStatsResponseDto,
} from '@modules/event/dtos/event-response.dto';
import { IEventRelatedTradeMessage } from '@modules/event/interfaces/event-message';
import { EventMessagingService } from '@modules/event/services/event-messaging.service';
import { EventQueryService } from '@modules/event/services/event-query.service';
import { EventTradeProcessorService } from '@modules/event/services/event-trade-processor.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EventService {
  constructor(
    private eventQueryService: EventQueryService,
    private eventTradeProcessorService: EventTradeProcessorService,
    private eventMessagingService: EventMessagingService,
  ) {}

  // ==================== Query Methods ====================

  async getActiveEvents(filter: EventFilterDto): Promise<EventInfoResponseDto[]> {
    return await this.eventQueryService.getActiveEvents(filter);
  }

  async getEventById(eventId: number): Promise<EventInfoResponseDto> {
    return await this.eventQueryService.getEventById(eventId);
  }

  async getEventLeaderboard(eventId: number, filter: LeaderboardFilterDto): Promise<EventLeaderboardResponseDto> {
    return await this.eventQueryService.getEventLeaderboard(eventId, filter);
  }

  async getUserEventStats(eventId: number, userId: number): Promise<UserEventStatsResponseDto> {
    return await this.eventQueryService.getUserEventStats(eventId, userId);
  }

  // ==================== Trade Processing Methods ====================

  async handleTradeCompletedForEvent(data: IEventRelatedTradeMessage): Promise<void> {
    return await this.eventTradeProcessorService.handleTradeCompletedForEvent(data);
  }

  async getEventTradeStats(eventId: number): Promise<{
    totalVolume: string;
    totalTrades: number;
    uniqueParticipants: number;
    topTokens: Array<{ token: string; volume: string; trades: number }>;
  }> {
    return await this.eventTradeProcessorService.getEventTradeStats(eventId);
  }

  // ==================== Messaging Methods ====================

  async emitEventStatusChanged(
    eventId: number,
    fromStatus: EEventStatus,
    toStatus: EEventStatus,
    changedBy?: number,
  ): Promise<void> {
    return await this.eventMessagingService.emitEventStatusChanged(eventId, fromStatus, toStatus, changedBy);
  }

  async emitEventRelatedTrade(swapTransaction: SwapTransactionEntity): Promise<void> {
    return await this.eventMessagingService.emitEventRelatedTrade(swapTransaction);
  }
}
