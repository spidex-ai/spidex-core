import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserGuard } from './user.guard';
import { UserActivityTrackingService } from '../services/user-activity-tracking.service';
import { LoggerService } from '../modules/loggers/logger.service';
import { UserEntity } from '../../database/entities/user.entity';
import { EUserStatus } from '../../constants/user.constant';
import { Unauthorized, BadRequestException } from '../exception';

describe('UserGuard', () => {
  let guard: UserGuard;
  let dataSource: any;
  let userActivityTrackingService: any;
  let loggerService: any;

  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  const mockRepository = {
    findOne: jest.fn(),
  };

  const mockUserActivityTrackingService = {
    trackUserActivity: jest.fn(),
  };

  const mockLoggerService = {
    getLogger: jest.fn().mockReturnValue(mockLogger),
  };

  const mockDataSource = {
    getRepository: jest.fn().mockReturnValue(mockRepository),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserGuard,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: UserActivityTrackingService,
          useValue: mockUserActivityTrackingService,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    guard = module.get<UserGuard>(UserGuard);
    dataSource = module.get(DataSource);
    userActivityTrackingService = module.get(UserActivityTrackingService);
    loggerService = module.get(LoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    const mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { userId: 1 },
          route: { path: '/api/test' },
          headers: { 'user-agent': 'test-agent' },
          ip: '127.0.0.1',
        }),
      }),
    } as ExecutionContext;

    it('should allow access for valid active user and track activity', async () => {
      const mockUser = {
        id: 1,
        status: EUserStatus.ACTIVE,
      };

      mockRepository.findOne.mockResolvedValue(mockUser);
      mockUserActivityTrackingService.trackUserActivity.mockResolvedValue(undefined);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        select: ['id', 'status'],
      });

      // Verify activity tracking was called
      expect(mockUserActivityTrackingService.trackUserActivity).toHaveBeenCalledWith({
        userId: 1,
        timestamp: expect.any(Date),
        endpoint: '/api/test',
        userAgent: 'test-agent',
        ipAddress: '127.0.0.1',
      });
    });

    it('should throw Unauthorized when no user in request', async () => {
      const mockContextNoUser = {
        switchToHttp: () => ({
          getRequest: () => ({}),
        }),
      } as ExecutionContext;

      await expect(guard.canActivate(mockContextNoUser)).rejects.toThrow(Unauthorized);
      expect(mockUserActivityTrackingService.trackUserActivity).not.toHaveBeenCalled();
    });

    it('should throw Unauthorized when user does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(Unauthorized);
      expect(mockUserActivityTrackingService.trackUserActivity).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when user is inactive', async () => {
      const mockUser = {
        id: 1,
        status: EUserStatus.INACTIVE,
      };

      mockRepository.findOne.mockResolvedValue(mockUser);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(BadRequestException);
      expect(mockUserActivityTrackingService.trackUserActivity).not.toHaveBeenCalled();
    });

    it('should handle activity tracking errors gracefully', async () => {
      const mockUser = {
        id: 1,
        status: EUserStatus.ACTIVE,
      };

      mockRepository.findOne.mockResolvedValue(mockUser);
      mockUserActivityTrackingService.trackUserActivity.mockRejectedValue(new Error('Tracking error'));

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockLogger.warn).toHaveBeenCalledWith('Failed to track activity for user 1:', expect.any(Error));
    });

    it('should handle missing request properties gracefully', async () => {
      const mockContextMinimal = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { userId: 1 },
            // Missing route, headers, ip
          }),
        }),
      } as ExecutionContext;

      const mockUser = {
        id: 1,
        status: EUserStatus.ACTIVE,
      };

      mockRepository.findOne.mockResolvedValue(mockUser);
      mockUserActivityTrackingService.trackUserActivity.mockResolvedValue(undefined);

      const result = await guard.canActivate(mockContextMinimal);

      expect(result).toBe(true);
      // Activity tracking happens asynchronously, so we just verify the guard works
    });
  });

  describe('checkMember', () => {
    it('should return true for valid active user', async () => {
      const mockUser = {
        id: 1,
        status: EUserStatus.ACTIVE,
      };

      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await guard.checkMember(1);

      expect(result).toBe(true);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        select: ['id', 'status'],
      });
    });

    it('should throw Unauthorized when user does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(guard.checkMember(1)).rejects.toThrow(Unauthorized);
    });

    it('should throw BadRequestException when user is inactive', async () => {
      const mockUser = {
        id: 1,
        status: EUserStatus.INACTIVE,
      };

      mockRepository.findOne.mockResolvedValue(mockUser);

      await expect(guard.checkMember(1)).rejects.toThrow(BadRequestException);
    });
  });
});
