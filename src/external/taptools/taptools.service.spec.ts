import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { TaptoolsService } from './taptools.service';
import { of, throwError } from 'rxjs';
import Redis from 'ioredis';
import { BadRequestException } from '../../shared/exception/exception.resolver';

describe('TaptoolsService', () => {
  let service: TaptoolsService;
  let httpService: jest.Mocked<HttpService>;
  let redis: jest.Mocked<Redis>;

  beforeEach(async () => {
    const mockHttpService = {
      post: jest.fn(),
      get: jest.fn(),
    };

    const mockRedis = {
      hget: jest.fn(),
      hset: jest.fn(),
      expire: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaptoolsService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: 'default_IORedisModuleConnectionToken',
          useValue: mockRedis,
        },
      ],
    }).compile();

    service = module.get<TaptoolsService>(TaptoolsService);
    httpService = module.get(HttpService);
    redis = module.get('default_IORedisModuleConnectionToken');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTokenPrices', () => {
    it('should return cached prices when all tokens are in cache', async () => {
      const units = ['unit1', 'unit2'];

      // Mock Redis cache hits
      redis.hget
        .mockResolvedValueOnce('1.5') // unit1
        .mockResolvedValueOnce('2.3'); // unit2

      const result = await service.getTokenPrices(units);

      expect(result).toEqual({
        unit1: 1.5,
        unit2: 2.3,
      });
      expect(httpService.post).not.toHaveBeenCalled();
      expect(redis.hget).toHaveBeenCalledTimes(2);
    });

    it('should fetch missing tokens from API and cache them', async () => {
      const units = ['unit1', 'unit2', 'unit3'];

      // Mock Redis cache: unit1 cached, unit2 and unit3 missing
      redis.hget
        .mockResolvedValueOnce('1.5') // unit1 cached
        .mockResolvedValueOnce(null) // unit2 missing
        .mockResolvedValueOnce(null); // unit3 missing

      // Mock API response for missing tokens
      httpService.post.mockReturnValue(
        of({
          data: {
            unit2: 2.3,
            unit3: 0.8,
          },
        } as any),
      );

      const result = await service.getTokenPrices(units);

      expect(result).toEqual({
        unit1: 1.5,
        unit2: 2.3,
        unit3: 0.8,
      });

      // Verify API was called with missing units only
      expect(httpService.post).toHaveBeenCalledWith('token/prices', ['unit2', 'unit3']);

      // Verify caching of new data
      expect(redis.hset).toHaveBeenCalledWith('token_prices', 'unit2', '2.3', 'unit3', '0.8');
      expect(redis.expire).toHaveBeenCalledWith('token_prices', 300); // 5 minutes in seconds
    });

    it('should handle cache read errors gracefully', async () => {
      const units = ['unit1'];

      // Mock Redis cache error
      redis.hget.mockRejectedValue(new Error('Redis connection error'));

      // Mock API response
      httpService.post.mockReturnValue(
        of({
          data: { unit1: 1.5 },
        } as any),
      );

      const result = await service.getTokenPrices(units);

      expect(result).toEqual({ unit1: 1.5 });
      expect(httpService.post).toHaveBeenCalledWith('token/prices', ['unit1']);
    });

    it('should handle cache write errors gracefully', async () => {
      const units = ['unit1'];

      // Mock Redis cache miss
      redis.hget.mockResolvedValue(null);

      // Mock Redis cache write error
      redis.hset.mockRejectedValue(new Error('Redis write error'));

      // Mock API response
      httpService.post.mockReturnValue(
        of({
          data: { unit1: 1.5 },
        } as any),
      );

      const result = await service.getTokenPrices(units);

      expect(result).toEqual({ unit1: 1.5 });
      // Should still return data even if caching fails
    });

    it('should throw BadRequestException when API call fails', async () => {
      const units = ['unit1'];

      // Mock Redis cache miss
      redis.hget.mockResolvedValue(null);

      // Mock API error
      httpService.post.mockReturnValue(throwError(() => new Error('API Error')));

      await expect(service.getTokenPrices(units)).rejects.toThrow(BadRequestException);
    });

    it('should handle empty units array', async () => {
      const result = await service.getTokenPrices([]);

      expect(result).toEqual({});
      expect(httpService.post).not.toHaveBeenCalled();
      expect(redis.hget).not.toHaveBeenCalled();
    });

    it('should handle API returning empty data', async () => {
      const units = ['unit1'];

      // Mock Redis cache miss
      redis.hget.mockResolvedValue(null);

      // Mock API response with empty data
      httpService.post.mockReturnValue(
        of({
          data: {},
        } as any),
      );

      const result = await service.getTokenPrices(units);

      expect(result).toEqual({});
      expect(redis.hset).not.toHaveBeenCalled();
      expect(redis.expire).not.toHaveBeenCalled();
    });

    it('should bypass cache when getIncludeCache is false', async () => {
      const units = ['unit1', 'unit2'];

      // Mock API response
      httpService.post.mockReturnValue(
        of({
          data: {
            unit1: 1.5,
            unit2: 2.3,
          },
        } as any),
      );

      const result = await service.getTokenPrices(units, false);

      expect(result).toEqual({
        unit1: 1.5,
        unit2: 2.3,
      });

      // Verify cache was not read
      expect(redis.hget).not.toHaveBeenCalled();

      // Verify API was called with all units (not just missing ones)
      expect(httpService.post).toHaveBeenCalledWith('token/prices', units);

      // Verify data was still cached for future use
      expect(redis.hset).toHaveBeenCalledWith('token_prices', 'unit1', '1.5', 'unit2', '2.3');
      expect(redis.expire).toHaveBeenCalledWith('token_prices', 300);
    });

    it('should still cache data when bypassing cache read', async () => {
      const units = ['unit1'];

      // Mock API response
      httpService.post.mockReturnValue(
        of({
          data: { unit1: 1.5 },
        } as any),
      );

      const result = await service.getTokenPrices(units, false);

      expect(result).toEqual({ unit1: 1.5 });

      // Verify cache read was bypassed
      expect(redis.hget).not.toHaveBeenCalled();

      // Verify data was still stored in cache
      expect(redis.hset).toHaveBeenCalledWith('token_prices', 'unit1', '1.5');
      expect(redis.expire).toHaveBeenCalledWith('token_prices', 300);
    });

    it('should handle cache write errors when bypassing cache read', async () => {
      const units = ['unit1'];

      // Mock Redis cache write error
      redis.hset.mockRejectedValue(new Error('Redis write error'));

      // Mock API response
      httpService.post.mockReturnValue(
        of({
          data: { unit1: 1.5 },
        } as any),
      );

      const result = await service.getTokenPrices(units, false);

      expect(result).toEqual({ unit1: 1.5 });
      // Should still return data even if caching fails
    });
  });
});
