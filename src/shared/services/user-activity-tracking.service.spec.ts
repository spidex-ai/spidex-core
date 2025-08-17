import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, QueryRunner } from 'typeorm';
import Redis from 'ioredis';
import { UserActivityTrackingService, UserActivityEvent } from './user-activity-tracking.service';
import { LoggerService } from '../modules/loggers/logger.service';
import { RabbitMQService } from '../modules/rabbitmq/rabbitmq.service';
import { UserEntity } from '../../database/entities/user.entity';

describe('UserActivityTrackingService', () => {
  let service: UserActivityTrackingService;
  let redis: jest.Mocked<Redis>;
  let dataSource: any;
  let loggerService: any;
  let rabbitMQService: any;

  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    query: jest.fn(),
  };

  const mockRepository = {
    findOne: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const mockRedis = {
      lpush: jest.fn(),
      llen: jest.fn(),
      lrange: jest.fn(),
      ltrim: jest.fn(),
    };

    const mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
      getRepository: jest.fn().mockReturnValue(mockRepository),
    };

    const mockLoggerService = {
      getLogger: jest.fn().mockReturnValue(mockLogger),
    };

    const mockRabbitMQService = {
      emitToCore: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserActivityTrackingService,
        {
          provide: 'default_IORedisModuleConnectionToken',
          useValue: mockRedis,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
        {
          provide: RabbitMQService,
          useValue: mockRabbitMQService,
        },
      ],
    }).compile();

    service = module.get<UserActivityTrackingService>(UserActivityTrackingService);
    redis = module.get('default_IORedisModuleConnectionToken');
    dataSource = module.get(DataSource);
    loggerService = module.get(LoggerService);
    rabbitMQService = module.get(RabbitMQService);

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('trackUserActivity', () => {
    it('should add user activity to Redis batch', async () => {
      const event: UserActivityEvent = {
        userId: 1,
        timestamp: new Date(),
        endpoint: '/api/test',
        userAgent: 'test-agent',
        ipAddress: '127.0.0.1',
      };

      redis.lpush.mockResolvedValue(1);
      redis.llen.mockResolvedValue(1);

      await service.trackUserActivity(event);

      expect(redis.lpush).toHaveBeenCalledWith('user_activity_batch', JSON.stringify(event));
      expect(mockLogger.debug).toHaveBeenCalledWith('User activity tracked for user 1');
    });

    it('should handle Redis errors gracefully', async () => {
      const event: UserActivityEvent = {
        userId: 1,
        timestamp: new Date(),
      };

      redis.lpush.mockRejectedValue(new Error('Redis error'));

      await expect(service.trackUserActivity(event)).resolves.not.toThrow();
      expect(mockLogger.error).toHaveBeenCalledWith('Error adding to activity batch:', expect.any(Error));
    });

    it('should trigger batch processing when batch size is reached', async () => {
      const event: UserActivityEvent = {
        userId: 1,
        timestamp: new Date(),
      };

      redis.lpush.mockResolvedValue(1);
      redis.llen.mockResolvedValue(50); // Batch size reached
      redis.lrange.mockResolvedValue([JSON.stringify(event)]);
      redis.ltrim.mockResolvedValue('OK');
      mockQueryRunner.query.mockResolvedValue(undefined);

      await service.trackUserActivity(event);

      expect(redis.lrange).toHaveBeenCalledWith('user_activity_batch', 0, 49);
    });
  });

  describe('getUserLastActivity', () => {
    it('should return user last activity timestamp', async () => {
      const lastActivity = new Date();
      mockRepository.findOne.mockResolvedValue({ lastActivityAt: lastActivity });

      const result = await service.getUserLastActivity(1);

      expect(result).toEqual(lastActivity);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        select: ['lastActivityAt'],
      });
    });

    it('should return null when user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.getUserLastActivity(1);

      expect(result).toBeNull();
    });

    it('should return null when user has no last activity', async () => {
      mockRepository.findOne.mockResolvedValue({ lastActivityAt: null });

      const result = await service.getUserLastActivity(1);

      expect(result).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      mockRepository.findOne.mockRejectedValue(new Error('Database error'));

      const result = await service.getUserLastActivity(1);

      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalledWith('Error getting last activity for user 1:', expect.any(Error));
    });
  });

  describe('getTrackingStats', () => {
    it('should return pending batch size', async () => {
      redis.llen.mockResolvedValue(25);

      const result = await service.getTrackingStats();

      expect(result).toEqual({ pendingBatchSize: 25 });
      expect(redis.llen).toHaveBeenCalledWith('user_activity_batch');
    });

    it('should handle Redis errors gracefully', async () => {
      redis.llen.mockRejectedValue(new Error('Redis error'));

      const result = await service.getTrackingStats();

      expect(result).toEqual({ pendingBatchSize: 0 });
      expect(mockLogger.error).toHaveBeenCalledWith('Error getting tracking stats:', expect.any(Error));
    });
  });

  describe('batch processing', () => {
    it('should process batch and update database', async () => {
      const events = [
        JSON.stringify({ userId: 1, timestamp: new Date('2024-01-01T10:00:00Z') }),
        JSON.stringify({ userId: 2, timestamp: new Date('2024-01-01T11:00:00Z') }),
      ];

      redis.lrange.mockResolvedValue(events);
      redis.ltrim.mockResolvedValue('OK');
      mockQueryRunner.query.mockResolvedValue(undefined);

      // Call the private method through reflection for testing
      await (service as any).processBatch();

      expect(redis.lrange).toHaveBeenCalledWith('user_activity_batch', 0, 49);
      expect(redis.ltrim).toHaveBeenCalledWith('user_activity_batch', 2, -1);
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should handle database transaction errors and rollback', async () => {
      const events = [JSON.stringify({ userId: 1, timestamp: new Date() })];

      redis.lrange.mockResolvedValue(events);
      redis.ltrim.mockResolvedValue('OK');
      mockQueryRunner.query.mockRejectedValue(new Error('Database error'));

      await (service as any).processBatch();

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should use fallback individual updates when batch update fails', async () => {
      const timestamp = new Date();
      const events = [JSON.stringify({ userId: 1, timestamp: timestamp.toISOString() })];

      redis.lrange.mockResolvedValue(events);
      redis.ltrim.mockResolvedValue('OK');
      mockQueryRunner.query.mockRejectedValue(new Error('Database error'));
      mockRepository.update.mockResolvedValue(undefined);

      await (service as any).processBatch();

      expect(mockRepository.update).toHaveBeenCalledWith(1, { lastActivityAt: expect.any(Date) });
    });

    it('should handle empty batch gracefully', async () => {
      redis.lrange.mockResolvedValue([]);

      await (service as any).processBatch();

      expect(redis.ltrim).not.toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).not.toHaveBeenCalled();
    });

    it('should group activities by user and keep latest timestamp', async () => {
      const events = [
        JSON.stringify({ userId: 1, timestamp: new Date('2024-01-01T10:00:00Z') }),
        JSON.stringify({ userId: 1, timestamp: new Date('2024-01-01T11:00:00Z') }), // Later timestamp
        JSON.stringify({ userId: 2, timestamp: new Date('2024-01-01T09:00:00Z') }),
      ];

      redis.lrange.mockResolvedValue(events);
      redis.ltrim.mockResolvedValue('OK');
      mockQueryRunner.query.mockResolvedValue(undefined);

      await (service as any).processBatch();

      // Verify that the query was called with the correct user IDs
      expect(mockQueryRunner.query).toHaveBeenCalledWith(expect.stringContaining('WHERE id IN (1,2)'));
    });
  });

  describe('flushPendingActivities', () => {
    it('should process all pending batches', async () => {
      redis.llen
        .mockResolvedValueOnce(10) // First check - has pending
        .mockResolvedValueOnce(0); // Second check - empty

      redis.lrange.mockResolvedValue([]);

      await service.flushPendingActivities();

      expect(redis.llen).toHaveBeenCalledTimes(2);
      expect(mockLogger.info).toHaveBeenCalledWith('All pending user activities flushed');
    });

    it('should handle errors during flush', async () => {
      redis.llen.mockRejectedValue(new Error('Redis error'));

      await service.flushPendingActivities();

      expect(mockLogger.error).toHaveBeenCalledWith('Error flushing pending activities:', expect.any(Error));
    });
  });
});
