import { UserEntity } from '@database/entities/user.entity';
import { LeaderboardFilterDto } from '@modules/event/dtos/event-request.dto';
import {
  EventInfoResponseDto,
  EventLeaderboardResponseDto,
  UserEventStatsResponseDto,
} from '@modules/event/dtos/event-response.dto';
import { EventService } from '@modules/event/services/event.service';
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthUser } from '@shared/decorators/auth-user.decorator';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import { IJwtPayload } from '@shared/interfaces/auth.interface';

@ApiTags('Events')
@ApiBearerAuth()
@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Get('active')
  @ApiOperation({ summary: 'Get all active events' })
  @ApiResponse({ status: 200, description: 'List of active events', type: [EventInfoResponseDto] })
  async getActiveEvents(): Promise<EventInfoResponseDto[]> {
    return this.eventService.getActiveEvents();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event details by ID' })
  @ApiResponse({ status: 200, description: 'Event details', type: EventInfoResponseDto })
  async getEventById(@Param('id') id: number): Promise<EventInfoResponseDto> {
    return this.eventService.getEventById(id);
  }

  @Get(':id/leaderboard')
  @ApiOperation({ summary: 'Get event leaderboard' })
  @ApiResponse({ status: 200, description: 'Event leaderboard', type: EventLeaderboardResponseDto })
  async getEventLeaderboard(
    @Param('id') id: number,
    @Query() filter: LeaderboardFilterDto,
  ): Promise<EventLeaderboardResponseDto> {
    return this.eventService.getEventLeaderboard(id, filter);
  }

  @Get(':id/my-stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user stats for an event' })
  @ApiResponse({ status: 200, description: 'User event statistics', type: UserEventStatsResponseDto })
  async getUserEventStats(
    @Param('id') eventId: number,
    @AuthUser() user: IJwtPayload,
  ): Promise<UserEventStatsResponseDto> {
    return this.eventService.getUserEventStats(eventId, user.userId);
  }
}
