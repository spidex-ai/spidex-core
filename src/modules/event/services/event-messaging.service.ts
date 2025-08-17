import { EEventStatus } from '@database/entities/event.entity';
import { SwapTransactionEntity } from '@database/entities/swap-transaction.entity';
import { IEventRelatedTradeMessage, IEventStatusChangedMessage } from '@modules/event/interfaces/event-message';
import { EVENT_PATTERNS } from '@modules/event/interfaces/event-pattern';
import { Injectable } from '@nestjs/common';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { RabbitMQService } from '@shared/modules/rabbitmq/rabbitmq.service';

@Injectable()
export class EventMessagingService {
  private readonly logger = this.loggerService.getLogger(EventMessagingService.name);

  constructor(
    private rabbitMQService: RabbitMQService,
    private loggerService: LoggerService,
  ) {}

  async emitEventStatusChanged(
    eventId: number,
    fromStatus: EEventStatus,
    toStatus: EEventStatus,
    changedBy?: number,
  ): Promise<void> {
    const message: IEventStatusChangedMessage = {
      eventId,
      fromStatus,
      toStatus,
      changedAt: new Date(),
      changedBy,
    };

    this.logger.info('Emitting event status changed', {
      eventId,
      fromStatus,
      toStatus,
      changedBy,
    });

    await this.rabbitMQService.emitToCore<IEventStatusChangedMessage>(EVENT_PATTERNS.EVENT_STATUS_CHANGED, message);
  }

  async emitEventRelatedTrade(swapTransaction: SwapTransactionEntity): Promise<void> {
    const message: IEventRelatedTradeMessage = {
      userId: swapTransaction.userId,
      usdVolume: swapTransaction.totalUsd,
      tokenA: swapTransaction.tokenA,
      tokenB: swapTransaction.tokenB,
      tokenAAmount: swapTransaction.tokenAAmount,
      tokenBAmount: swapTransaction.tokenBAmount,
      txHash: swapTransaction.txHash,
      timestamp: swapTransaction.createdAt,
      transactionId: swapTransaction.id,
      exchange: swapTransaction.exchange,
    };

    this.logger.info('Emitting event related trade', {
      userId: swapTransaction.userId,
      txHash: swapTransaction.txHash,
      volumeUsd: swapTransaction.totalUsd,
      exchange: swapTransaction.exchange,
    });

    await this.rabbitMQService.emitToCore(EVENT_PATTERNS.EVENT_RELATED_TRADE, message);
  }
}