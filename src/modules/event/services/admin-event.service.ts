import { EEventStatus } from '@database/entities/event.entity';
import { EUserPointLogType } from '@database/entities/user-point-log.entity';
import { EventParticipantRepository } from '@database/repositories/event-participant.repository';
import { EventRankPrizeRepository } from '@database/repositories/event-rank-prize.repository';
import { EventTradeRepository } from '@database/repositories/event-trade.repository';
import { EventRepository } from '@database/repositories/event.repository';
import {
  AdminEventFilterDto,
  AdminEventResponseDto,
  EventAnalyticsResponseDto,
  PrizeDistributionResultDto,
} from '@modules/event/dtos/admin-event.dto';
import { CreateEventDto, UpdateEventDto, UpdateEventStatusDto } from '@modules/event/dtos/event-request.dto';
import { EventService } from '@modules/event/services/event.service';
import { UserPointService } from '@modules/user-point/services/user-point.service';
import { EUserPointType } from '@modules/user-point/user-point.constant';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PageMetaDto } from '@shared/dtos/page-meta.dto';
import { PageDto } from '@shared/dtos/page.dto';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { plainToClass } from 'class-transformer';
import { Decimal } from 'decimal.js';
import { IsNull } from 'typeorm';
import { Transactional } from 'typeorm-transactional';

@Injectable()
export class AdminEventService {
  private readonly logger = this.loggerService.getLogger(AdminEventService.name);

  constructor(
    private eventRepository: EventRepository,
    private eventParticipantRepository: EventParticipantRepository,
    private eventRankPrizeRepository: EventRankPrizeRepository,
    private eventTradeRepository: EventTradeRepository,
    private eventService: EventService,
    private userPointService: UserPointService,
    private loggerService: LoggerService,
  ) {}

  async getEvents(filter: AdminEventFilterDto): Promise<PageDto<AdminEventResponseDto>> {
    this.logger.info('Getting events for admin', { filter });

    const queryBuilder = this.eventRepository.createQueryBuilder('event').where('event.deletedAt IS NULL');

    // Apply filters
    if (filter.status) {
      queryBuilder.andWhere('event.status = :status', { status: filter.status });
    }

    if (filter.type) {
      queryBuilder.andWhere('event.type = :type', { type: filter.type });
    }

    if (filter.createdFrom) {
      queryBuilder.andWhere('event.createdAt >= :createdFrom', { createdFrom: new Date(filter.createdFrom) });
    }

    if (filter.createdTo) {
      queryBuilder.andWhere('event.createdAt <= :createdTo', { createdTo: new Date(filter.createdTo) });
    }

    if (filter.search) {
      queryBuilder.andWhere('(event.name ILIKE :search OR event.description ILIKE :search)', {
        search: `%${filter.search}%`,
      });
    }

    // Get total count
    const totalItems = await queryBuilder.getCount();

    // Apply pagination and get results
    const events = await queryBuilder
      .orderBy('event.createdAt', 'DESC')
      .skip((filter.page - 1) * filter.limit)
      .take(filter.limit)
      .getMany();

    // Get statistics for each event
    const eventsWithStats = await Promise.all(
      events.map(async event => {
        const stats = await this.getEventBasicStats(event.id);
        return {
          ...event,
          participantCount: stats.participantCount,
          totalVolumeTraded: stats.totalVolumeTraded,
          totalTrades: stats.totalTrades,
        };
      }),
    );

    const responseItems = eventsWithStats.map(event =>
      plainToClass(AdminEventResponseDto, event, { excludeExtraneousValues: true }),
    );

    return new PageDto<AdminEventResponseDto>(responseItems, new PageMetaDto(totalItems, filter));
  }

  @Transactional()
  async createEvent(createEventDto: CreateEventDto, adminId: number): Promise<AdminEventResponseDto> {
    this.logger.info('Creating new event', { createEventDto, adminId });

    // Validate dates
    const startDate = new Date(createEventDto.startDate);
    const endDate = new Date(createEventDto.endDate);

    if (startDate >= endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    if (endDate <= new Date()) {
      throw new BadRequestException('End date must be in the future');
    }

    // Validate rank prizes
    this.validateRankPrizes(createEventDto.rankPrizes);

    // Create event
    const event = this.eventRepository.create({
      name: createEventDto.name,
      description: createEventDto.description,
      totalPrize: new Decimal(createEventDto.totalPrize),
      startDate,
      endDate,
      type: createEventDto.type,
      status: EEventStatus.DRAFT,
      tradeToken: createEventDto.tradeToken,
      icon: createEventDto.icon,
      createdBy: adminId,
    });

    const savedEvent = await this.eventRepository.save(event);

    // Create rank prizes
    const rankPrizes = createEventDto.rankPrizes.map(prize =>
      this.eventRankPrizeRepository.create({
        eventId: savedEvent.id,
        rankFrom: prize.rankFrom,
        rankTo: prize.rankTo,
        prizePoints: new Decimal(prize.prizePoints),
        prizeToken: prize.prizeToken,
        prizeTokenAmount: prize.prizeTokenAmount ? new Decimal(prize.prizeTokenAmount) : null,
        description: prize.description,
      }),
    );

    await this.eventRankPrizeRepository.save(rankPrizes);

    // Return event with stats
    const stats = await this.getEventBasicStats(savedEvent.id);
    const eventWithStats = {
      ...savedEvent,
      participantCount: stats.participantCount,
      totalVolumeTraded: stats.totalVolumeTraded,
      totalTrades: stats.totalTrades,
    };

    return plainToClass(AdminEventResponseDto, eventWithStats, { excludeExtraneousValues: true });
  }

  @Transactional()
  async updateEvent(eventId: number, updateEventDto: UpdateEventDto, adminId: number): Promise<AdminEventResponseDto> {
    this.logger.info('Updating event', { eventId, updateEventDto, adminId });

    const event = await this.eventRepository.findOne({
      where: { id: eventId, deletedAt: IsNull() },
      relations: ['rankPrizes'],
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Validate that event can be updated
    if (event.status === EEventStatus.ENDED || event.status === EEventStatus.PRIZES_DISTRIBUTED) {
      throw new BadRequestException('Cannot update completed events');
    }

    // Validate dates if provided
    if (updateEventDto.startDate || updateEventDto.endDate) {
      const startDate = updateEventDto.startDate ? new Date(updateEventDto.startDate) : event.startDate;
      const endDate = updateEventDto.endDate ? new Date(updateEventDto.endDate) : event.endDate;

      if (startDate >= endDate) {
        throw new BadRequestException('Start date must be before end date');
      }
    }

    // Update event fields
    if (updateEventDto.name) event.name = updateEventDto.name;
    if (updateEventDto.description) event.description = updateEventDto.description;
    if (updateEventDto.totalPrize) event.totalPrize = new Decimal(updateEventDto.totalPrize);
    if (updateEventDto.startDate) event.startDate = new Date(updateEventDto.startDate);
    if (updateEventDto.endDate) event.endDate = new Date(updateEventDto.endDate);
    if (updateEventDto.type) event.type = updateEventDto.type;
    if (updateEventDto.tradeToken) event.tradeToken = updateEventDto.tradeToken;
    if (updateEventDto.icon !== undefined) event.icon = updateEventDto.icon;

    // Update rank prizes if provided
    if (updateEventDto.rankPrizes) {
      this.validateRankPrizes(updateEventDto.rankPrizes);

      // Delete existing prizes
      await this.eventRankPrizeRepository.deletePrizesByEvent(eventId);

      // Create new prizes
      const newRankPrizes = updateEventDto.rankPrizes.map(prize =>
        this.eventRankPrizeRepository.create({
          eventId,
          rankFrom: prize.rankFrom,
          rankTo: prize.rankTo,
          prizePoints: new Decimal(prize.prizePoints),
          prizeToken: prize.prizeToken,
          prizeTokenAmount: prize.prizeTokenAmount ? new Decimal(prize.prizeTokenAmount) : null,
          description: prize.description,
        }),
      );

      await this.eventRankPrizeRepository.save(newRankPrizes);
    }

    const savedEvent = await this.eventRepository.save(event);

    // Return event with stats
    const stats = await this.getEventBasicStats(eventId);
    const eventWithStats = {
      ...savedEvent,
      participantCount: stats.participantCount,
      totalVolumeTraded: stats.totalVolumeTraded,
      totalTrades: stats.totalTrades,
    };

    return plainToClass(AdminEventResponseDto, eventWithStats, { excludeExtraneousValues: true });
  }

  async updateEventStatus(
    eventId: number,
    updateStatusDto: UpdateEventStatusDto,
    adminId: number,
  ): Promise<AdminEventResponseDto> {
    this.logger.info('Updating event status', { eventId, updateStatusDto, adminId });

    const event = await this.eventRepository.findOne({
      where: { id: eventId, deletedAt: IsNull() },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const oldStatus = event.status;
    const newStatus = updateStatusDto.status;

    // Validate status transition
    if (!this.isValidStatusTransition(oldStatus, newStatus)) {
      throw new BadRequestException(`Invalid status transition from ${oldStatus} to ${newStatus}`);
    }

    event.status = newStatus;
    const savedEvent = await this.eventRepository.save(event);

    // Emit status change event
    await this.eventService.emitEventStatusChanged(eventId, oldStatus, newStatus, adminId);

    // Return event with stats
    const stats = await this.getEventBasicStats(eventId);
    const eventWithStats = {
      ...savedEvent,
      participantCount: stats.participantCount,
      totalVolumeTraded: stats.totalVolumeTraded,
      totalTrades: stats.totalTrades,
    };

    return plainToClass(AdminEventResponseDto, eventWithStats, { excludeExtraneousValues: true });
  }

  async deleteEvent(eventId: number, adminId: number): Promise<void> {
    this.logger.info('Deleting event', { eventId, adminId });

    const event = await this.eventRepository.findOne({
      where: { id: eventId, deletedAt: IsNull() },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.status === EEventStatus.ACTIVE) {
      throw new BadRequestException('Cannot delete active events');
    }

    // Soft delete
    await this.eventRepository.update(eventId, { deletedAt: new Date() });
  }

  async getEventAnalytics(eventId: number): Promise<EventAnalyticsResponseDto> {
    this.logger.info('Getting event analytics', { eventId });

    const event = await this.eventRepository.findOne({
      where: { id: eventId, deletedAt: IsNull() },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const analytics = await this.eventRepository.getEventAnalytics(eventId);

    return plainToClass(
      EventAnalyticsResponseDto,
      {
        eventId,
        name: event.name,
        status: event.status,
        ...analytics,
        generatedAt: new Date(),
      },
      { excludeExtraneousValues: true },
    );
  }

  @Transactional()
  async distributePrizes(eventId: number, adminId: number): Promise<PrizeDistributionResultDto> {
    this.logger.info('Distributing prizes for event', { eventId, adminId });

    const event = await this.eventRepository.findOne({
      where: { id: eventId, status: EEventStatus.ENDED, deletedAt: IsNull() },
      relations: ['rankPrizes'],
    });

    if (!event) {
      throw new NotFoundException('Event not found or not ended');
    }

    // Update ranks first
    await this.eventRepository.updateParticipantRank(eventId);

    // Get participants with unclaimed prizes
    const participants = await this.eventParticipantRepository.getUnclaimedPrizeParticipants(eventId);

    const distributions = [];
    let successfulDistributions = 0;

    for (const participant of participants) {
      const prize = event.rankPrizes.find(
        p => participant.rank && participant.rank >= p.rankFrom && participant.rank <= p.rankTo,
      );

      if (!prize || !participant.rank) {
        continue;
      }

      try {
        // Distribute points
        if (prize.prizePoints && prize.prizePoints.gt(0)) {
          await this.userPointService.emitUserPointChangeEvent({
            userId: participant.userId,
            amount: prize.prizePoints.toString(),
            type: EUserPointType.QUEST,
            logType: EUserPointLogType.FROM_SYSTEM,
            userQuestId: participant.id,
            plusToReferral: false, // Events don't give referral bonuses
          });
        }

        // TODO: Implement token prize distribution if needed

        // Mark as claimed
        await this.eventParticipantRepository.update(participant.id, {
          prizeClaimed: true,
          prizeClaimedAt: new Date(),
        });

        distributions.push({
          userId: participant.userId,
          rank: participant.rank,
          prizePoints: prize.prizePoints?.toString(),
          prizeToken: prize.prizeToken,
          prizeTokenAmount: prize.prizeTokenAmount?.toString(),
          success: true,
        });

        successfulDistributions++;
      } catch (error) {
        distributions.push({
          userId: participant.userId,
          rank: participant.rank,
          prizePoints: prize.prizePoints?.toString(),
          prizeToken: prize.prizeToken,
          prizeTokenAmount: prize.prizeTokenAmount?.toString(),
          success: false,
          error: error.message,
        });
      }
    }

    // Update event status
    await this.eventRepository.update(eventId, {
      status: EEventStatus.PRIZES_DISTRIBUTED,
    });

    return plainToClass(
      PrizeDistributionResultDto,
      {
        eventId,
        totalDistributions: distributions.length,
        successfulDistributions,
        failedDistributions: distributions.length - successfulDistributions,
        distributions,
        distributedAt: new Date(),
        distributedBy: adminId,
      },
      { excludeExtraneousValues: true },
    );
  }

  async recalculateEventLeaderboard(eventId: number): Promise<void> {
    this.logger.info('Recalculating event leaderboard', { eventId });

    const event = await this.eventRepository.findOne({
      where: { id: eventId, deletedAt: IsNull() },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Update participant totals
    const participants = await this.eventParticipantRepository.getEventParticipants(eventId);

    for (const participant of participants) {
      await this.eventParticipantRepository.updateParticipantTotals(participant.id);
    }

    // Update ranks
    await this.eventRepository.updateParticipantRank(eventId);
  }

  private validateRankPrizes(rankPrizes: any[]): void {
    if (!rankPrizes || rankPrizes.length === 0) {
      throw new BadRequestException('At least one rank prize must be defined');
    }

    // Sort by rank_from to check for overlaps
    const sortedPrizes = rankPrizes.sort((a, b) => a.rankFrom - b.rankFrom);

    for (let i = 0; i < sortedPrizes.length; i++) {
      const prize = sortedPrizes[i];

      if (prize.rankFrom > prize.rankTo) {
        throw new BadRequestException(`Rank from (${prize.rankFrom}) cannot be greater than rank to (${prize.rankTo})`);
      }

      // Check for overlaps with next prize
      if (i < sortedPrizes.length - 1) {
        const nextPrize = sortedPrizes[i + 1];
        if (prize.rankTo >= nextPrize.rankFrom) {
          throw new BadRequestException(
            `Rank ranges overlap: ${prize.rankFrom}-${prize.rankTo} and ${nextPrize.rankFrom}-${nextPrize.rankTo}`,
          );
        }
      }
    }
  }

  private isValidStatusTransition(from: EEventStatus, to: EEventStatus): boolean {
    const validTransitions = {
      [EEventStatus.DRAFT]: [EEventStatus.ACTIVE, EEventStatus.CANCELLED],
      [EEventStatus.ACTIVE]: [EEventStatus.ENDED, EEventStatus.CANCELLED],
      [EEventStatus.ENDED]: [EEventStatus.PRIZES_DISTRIBUTED],
      [EEventStatus.CANCELLED]: [],
      [EEventStatus.PRIZES_DISTRIBUTED]: [],
    };

    return validTransitions[from]?.includes(to) || false;
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
}
