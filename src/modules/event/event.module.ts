import { forwardRef, Module } from '@nestjs/common';
import { CustomRepositoryModule } from 'nestjs-typeorm-custom-repository';

// Repositories
import { EventParticipantRepository } from '@database/repositories/event-participant.repository';
import { EventRankPrizeRepository } from '@database/repositories/event-rank-prize.repository';
import { EventTradeRepository } from '@database/repositories/event-trade.repository';
import { EventRepository } from '@database/repositories/event.repository';

// Controllers
import { AdminEventController } from '@modules/event/controllers/admin-event.controller';
import { EventController } from '@modules/event/controllers/event.controller';

// Services
import { AdminEventService } from '@modules/event/services/admin-event.service';
import { EventService } from '@modules/event/services/event.service';
import { EventQueryService } from '@modules/event/services/event-query.service';
import { EventTradeProcessorService } from '@modules/event/services/event-trade-processor.service';
import { EventMessagingService } from '@modules/event/services/event-messaging.service';
import { LeaderboardService } from '@modules/event/services/leaderboard.service';

// External modules
import { UserRepository } from '@database/repositories/user.repository';
import { SwapModule } from '@modules/swap/swap.module';
import { TokenMetaModule } from '@modules/token-metadata/token-meta.module';
import { UserPointModule } from '@modules/user-point/user-point.module';

@Module({
  imports: [
    CustomRepositoryModule.forFeature([
      EventRepository,
      EventParticipantRepository,
      EventRankPrizeRepository,
      EventTradeRepository,
      UserRepository,
    ]),
    forwardRef(() => UserPointModule),
    forwardRef(() => SwapModule),
    TokenMetaModule,
  ],
  controllers: [EventController, AdminEventController],
  providers: [
    EventService,
    EventQueryService,
    EventTradeProcessorService,
    EventMessagingService,
    AdminEventService,
    LeaderboardService,
  ],
  exports: [EventService, AdminEventService, LeaderboardService],
})
export class EventModule {}
