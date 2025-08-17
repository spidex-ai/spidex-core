import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import Redis from 'ioredis';
import { AdminAnalyticsService } from './admin-analytics.service';
import { LoggerService } from '../../../shared/modules/loggers/logger.service';
import { AnalyticsTimeframe, AnalyticsTimeRange } from '../dtos/admin-analytics.dto';

describe('AdminAnalyticsService', () => {
  let service: AdminAnalyticsService;
  let redis: jest.Mocked<Redis>;
  let dataSource: any;
  let loggerService: any;

  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  beforeEach(async () => {
    const mockRedis = {
      get: jest.fn(),
      setex: jest.fn(),
      keys: jest.fn(),
      del: jest.fn(),
    };

    const mockDataSource = {
      query: jest.fn(),
    };

    const mockLoggerService = {
      getLogger: jest.fn().mockReturnValue(mockLogger),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminAnalyticsService,
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
      ],
    }).compile();

    service = module.get<AdminAnalyticsService>(AdminAnalyticsService);
    redis = module.get('default_IORedisModuleConnectionToken');
    dataSource = module.get(DataSource);
    loggerService = module.get(LoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDailyActiveUsers', () => {
    it('should return cached data when available', async () => {
      const cachedData = {
        date: '2024-01-15',
        activeUsers: 5,
        details: [],
      };

      redis.get.mockResolvedValue(JSON.stringify(cachedData));

      const result = await service.getDailyActiveUsers('2024-01-15', AnalyticsTimeRange.ONE_DAY);

      expect(result).toEqual(cachedData);
      expect(redis.get).toHaveBeenCalledWith('admin_analytics_daily_active_users_2024-01-15_1d');
      expect(dataSource.query).not.toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Cache hit for daily active users: 2024-01-15, 1d');
    });

    it('should fetch from database when cache miss', async () => {
      const mockUsers = [
        { userId: 1, username: 'user1', lastActivity: new Date(), activityType: 'point_activity' },
        { userId: 2, username: 'user2', lastActivity: new Date(), activityType: 'swap_activity' },
      ];

      redis.get.mockResolvedValue(null);
      dataSource.query.mockResolvedValue(mockUsers);

      const result = await service.getDailyActiveUsers('2024-01-15', AnalyticsTimeRange.ONE_DAY, true);

      expect(result.date).toBe('2024-01-15');
      expect(result.activeUsers).toBe(2);
      expect(result.details).toEqual(mockUsers);
      expect(redis.setex).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Cache miss for daily active users: 2024-01-15, 1d');
    });

    it('should use current date when no date provided', async () => {
      const currentDate = new Date().toISOString().split('T')[0];
      redis.get.mockResolvedValue(null);
      dataSource.query.mockResolvedValue([]);

      await service.getDailyActiveUsers();

      expect(redis.get).toHaveBeenCalledWith(`admin_analytics_daily_active_users_${currentDate}_1d`);
    });

    it('should handle different time ranges', async () => {
      redis.get.mockResolvedValue(null);
      dataSource.query.mockResolvedValue([]);

      await service.getDailyActiveUsers('2024-01-15', AnalyticsTimeRange.SEVEN_DAYS);

      expect(dataSource.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([
          expect.stringContaining('2024-01-09'), // 7 days before
          expect.stringContaining('2024-01-15'),
          expect.stringContaining('2024-01-16'), // end date + 1 day
        ]),
      );
    });
  });

  describe('getTopVolumeUsers', () => {
    it('should return cached data when available', async () => {
      const cachedData = [{ userId: 1, username: 'user1', totalVolume: 1000, transactionCount: 5 }];

      redis.get.mockResolvedValue(JSON.stringify(cachedData));

      const result = await service.getTopVolumeUsers(AnalyticsTimeframe.ONE_DAY, 10);

      expect(result).toEqual(cachedData);
      expect(redis.get).toHaveBeenCalledWith('admin_analytics_top_volume_users_1d_10');
      expect(dataSource.query).not.toHaveBeenCalled();
    });

    it('should fetch from database when cache miss', async () => {
      const mockUsers = [
        { userId: 1, username: 'user1', totalVolume: 1000, transactionCount: 5 },
        { userId: 2, username: 'user2', totalVolume: 800, transactionCount: 3 },
      ];

      redis.get.mockResolvedValue(null);
      dataSource.query.mockResolvedValue(mockUsers);

      const result = await service.getTopVolumeUsers(AnalyticsTimeframe.SEVEN_DAYS, 5);

      expect(result).toEqual(mockUsers);
      expect(redis.setex).toHaveBeenCalled();
      expect(dataSource.query).toHaveBeenCalledWith(expect.any(String), [5]);
    });

    it('should handle all-time timeframe', async () => {
      redis.get.mockResolvedValue(null);
      dataSource.query.mockResolvedValue([]);

      await service.getTopVolumeUsers(AnalyticsTimeframe.ALL_TIME, 10);

      const queryCall = dataSource.query.mock.calls[0][0];
      expect(queryCall).not.toContain('AND st.created_at >=');
    });
  });

  describe('getTopSilkPointUsers', () => {
    it('should return cached data when available', async () => {
      const cachedData = [{ userId: 1, username: 'user1', silkPoints: 1000, pointsEarned: 500 }];

      redis.get.mockResolvedValue(JSON.stringify(cachedData));

      const result = await service.getTopSilkPointUsers(AnalyticsTimeframe.ONE_DAY, 10);

      expect(result).toEqual(cachedData);
      expect(redis.get).toHaveBeenCalledWith('admin_analytics_top_silk_point_users_1d_10');
    });

    it('should convert string amounts to numbers', async () => {
      const mockUsers = [{ userId: 1, username: 'user1', silkPoints: '1000.50', pointsEarned: '500.25' }];

      redis.get.mockResolvedValue(null);
      dataSource.query.mockResolvedValue(mockUsers);

      const result = await service.getTopSilkPointUsers(AnalyticsTimeframe.ONE_DAY, 10);

      expect(result[0].silkPoints).toBe(1000.5);
      expect(result[0].pointsEarned).toBe(500.25);
    });
  });

  describe('getTopReferralUsers', () => {
    it('should return cached data when available', async () => {
      const cachedData = [{ userId: 1, username: 'user1', referralCount: 10, referralRewards: 100 }];

      redis.get.mockResolvedValue(JSON.stringify(cachedData));

      const result = await service.getTopReferralUsers(AnalyticsTimeframe.ONE_DAY, 10);

      expect(result).toEqual(cachedData);
      expect(redis.get).toHaveBeenCalledWith('admin_analytics_top_referral_users_1d_10');
    });

    it('should convert string counts to numbers', async () => {
      const mockUsers = [{ userId: 1, username: 'user1', referralCount: '10', referralRewards: '100.50' }];

      redis.get.mockResolvedValue(null);
      dataSource.query.mockResolvedValue(mockUsers);

      const result = await service.getTopReferralUsers(AnalyticsTimeframe.ONE_DAY, 10);

      expect(result[0].referralCount).toBe(10);
      expect(result[0].referralRewards).toBe(100.5);
    });
  });

  describe('clearAnalyticsCache', () => {
    it('should clear all analytics cache when no type specified', async () => {
      const mockKeys = ['admin_analytics_daily_active_users_2024-01-15_1d', 'admin_analytics_top_volume_users_1d_10'];
      redis.keys.mockResolvedValue(mockKeys);

      await service.clearAnalyticsCache();

      expect(redis.keys).toHaveBeenCalledWith('admin_analytics_*');
      expect(redis.del).toHaveBeenCalledWith(...mockKeys);
      expect(mockLogger.info).toHaveBeenCalledWith('Cleared 2 analytics cache keys with pattern: admin_analytics_*');
    });

    it('should clear specific cache type when specified', async () => {
      const mockKeys = ['admin_analytics_daily_active_users_2024-01-15_1d'];
      redis.keys.mockResolvedValue(mockKeys);

      await service.clearAnalyticsCache('daily_active_users');

      expect(redis.keys).toHaveBeenCalledWith('admin_analytics_daily_active_users_*');
      expect(redis.del).toHaveBeenCalledWith(...mockKeys);
    });

    it('should handle no keys found', async () => {
      redis.keys.mockResolvedValue([]);

      await service.clearAnalyticsCache();

      expect(redis.del).not.toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('No analytics cache keys found with pattern: admin_analytics_*');
    });
  });

  describe('error handling', () => {
    it('should handle database errors in getDailyActiveUsers', async () => {
      redis.get.mockResolvedValue(null);
      dataSource.query.mockRejectedValue(new Error('Database error'));

      await expect(service.getDailyActiveUsers()).rejects.toThrow('Database error');
      expect(mockLogger.error).toHaveBeenCalledWith('Error getting daily active users:', expect.any(Error));
    });

    it('should handle redis errors in getTopVolumeUsers', async () => {
      redis.get.mockRejectedValue(new Error('Redis error'));

      await expect(service.getTopVolumeUsers()).rejects.toThrow('Redis error');
      expect(mockLogger.error).toHaveBeenCalledWith('Error getting top volume users:', expect.any(Error));
    });
  });
});
