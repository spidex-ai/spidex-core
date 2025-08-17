import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Param, 
  Query, 
  Body, 
  UseGuards,
  ParseIntPipe 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminEventService } from '@modules/event/services/admin-event.service';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import { AuthUser } from '@shared/decorators/auth-user.decorator';
import { AdminEntity } from '@database/entities/admin.entity';
import { 
  CreateEventDto, 
  UpdateEventDto, 
  UpdateEventStatusDto 
} from '@modules/event/dtos/event-request.dto';
import { 
  AdminEventFilterDto,
  AdminEventResponseDto,
  EventAnalyticsResponseDto,
  PrizeDistributionResultDto
} from '@modules/event/dtos/admin-event.dto';
import { PageDto } from '@shared/dtos/page.dto';

@ApiTags('Admin - Events')
@Controller('admin/events')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AdminEventController {
  constructor(private readonly adminEventService: AdminEventService) {}

  @Get()
  @ApiOperation({ summary: 'Get all events for admin management' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of events with admin details', 
    type: PageDto<AdminEventResponseDto> 
  })
  async getEvents(@Query() filter: AdminEventFilterDto): Promise<PageDto<AdminEventResponseDto>> {
    return this.adminEventService.getEvents(filter);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({ 
    status: 201, 
    description: 'Event created successfully', 
    type: AdminEventResponseDto 
  })
  async createEvent(
    @Body() createEventDto: CreateEventDto,
    @AuthUser() admin: AdminEntity,
  ): Promise<AdminEventResponseDto> {
    return this.adminEventService.createEvent(createEventDto, admin.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event details for admin' })
  @ApiResponse({ 
    status: 200, 
    description: 'Event details with admin info', 
    type: AdminEventResponseDto 
  })
  async getEventById(
    @Param('id', ParseIntPipe) eventId: number
  ): Promise<AdminEventResponseDto> {
    // For now, we'll reuse the existing method from EventService
    // In a real implementation, you might want admin-specific details
    const events = await this.adminEventService.getEvents({
      page: 1,
      limit: 1
    } as AdminEventFilterDto);
    
    const event = events.data.find(e => e.id === eventId);
    if (!event) {
      throw new Error('Event not found');
    }
    
    return event;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an event' })
  @ApiResponse({ 
    status: 200, 
    description: 'Event updated successfully', 
    type: AdminEventResponseDto 
  })
  async updateEvent(
    @Param('id', ParseIntPipe) eventId: number,
    @Body() updateEventDto: UpdateEventDto,
    @AuthUser() admin: AdminEntity,
  ): Promise<AdminEventResponseDto> {
    return this.adminEventService.updateEvent(eventId, updateEventDto, admin.id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update event status' })
  @ApiResponse({ 
    status: 200, 
    description: 'Event status updated successfully', 
    type: AdminEventResponseDto 
  })
  async updateEventStatus(
    @Param('id', ParseIntPipe) eventId: number,
    @Body() updateStatusDto: UpdateEventStatusDto,
    @AuthUser() admin: AdminEntity,
  ): Promise<AdminEventResponseDto> {
    return this.adminEventService.updateEventStatus(eventId, updateStatusDto, admin.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an event' })
  @ApiResponse({ status: 200, description: 'Event deleted successfully' })
  async deleteEvent(
    @Param('id', ParseIntPipe) eventId: number,
    @AuthUser() admin: AdminEntity,
  ): Promise<{ message: string }> {
    await this.adminEventService.deleteEvent(eventId, admin.id);
    return { message: 'Event deleted successfully' };
  }

  @Get(':id/analytics')
  @ApiOperation({ summary: 'Get detailed event analytics' })
  @ApiResponse({ 
    status: 200, 
    description: 'Event analytics data', 
    type: EventAnalyticsResponseDto 
  })
  async getEventAnalytics(
    @Param('id', ParseIntPipe) eventId: number
  ): Promise<EventAnalyticsResponseDto> {
    return this.adminEventService.getEventAnalytics(eventId);
  }

  @Post(':id/distribute-prizes')
  @ApiOperation({ summary: 'Distribute prizes for completed event' })
  @ApiResponse({ 
    status: 200, 
    description: 'Prizes distributed successfully', 
    type: PrizeDistributionResultDto 
  })
  async distributePrizes(
    @Param('id', ParseIntPipe) eventId: number,
    @AuthUser() admin: AdminEntity,
  ): Promise<PrizeDistributionResultDto> {
    return this.adminEventService.distributePrizes(eventId, admin.id);
  }

  @Post(':id/recalculate-leaderboard')
  @ApiOperation({ summary: 'Manually recalculate event leaderboard' })
  @ApiResponse({ status: 200, description: 'Leaderboard recalculated successfully' })
  async recalculateLeaderboard(
    @Param('id', ParseIntPipe) eventId: number
  ): Promise<{ message: string }> {
    await this.adminEventService.recalculateEventLeaderboard(eventId);
    return { message: 'Leaderboard recalculated successfully' };
  }
}