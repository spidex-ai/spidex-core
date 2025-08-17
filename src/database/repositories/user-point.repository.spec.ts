import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { UserPointRepository } from './user-point.repository';

describe('UserPointRepository', () => {
  let repository: UserPointRepository;
  let dataSource: any;

  const mockDataSource = {
    query: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserPointRepository,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    repository = module.get<UserPointRepository>(UserPointRepository);
    dataSource = module.get(DataSource);

    // Mock the repository's query method
    repository.query = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserRank', () => {
    it('should return correct rank for a user', async () => {
      const mockResult = [
        {
          userId: '2',
          amount: '1000.50',
          rank: '3',
          referralCount: '5',
        },
      ];

      (repository.query as jest.Mock).mockResolvedValue(mockResult);

      const result = await repository.getUserRank(2);

      expect(result).toEqual({
        id: 2,
        rank: 3,
        amount: '1000.50',
        referralCount: 5,
      });

      expect(repository.query).toHaveBeenCalledWith(
        expect.stringContaining('RANK() OVER (ORDER BY CAST(up.amount AS DECIMAL) DESC)'),
        [2]
      );
    });

    it('should return null when user not found', async () => {
      (repository.query as jest.Mock).mockResolvedValue([]);

      const result = await repository.getUserRank(999);

      expect(result).toBeNull();
    });

    it('should handle user with rank 1', async () => {
      const mockResult = [
        {
          userId: '1',
          amount: '5000.00',
          rank: '1',
          referralCount: '10',
        },
      ];

      (repository.query as jest.Mock).mockResolvedValue(mockResult);

      const result = await repository.getUserRank(1);

      expect(result).toEqual({
        id: 1,
        rank: 1,
        amount: '5000.00',
        referralCount: 10,
      });
    });

    it('should handle user with no referrals', async () => {
      const mockResult = [
        {
          userId: '3',
          amount: '500.00',
          rank: '10',
          referralCount: '0',
        },
      ];

      (repository.query as jest.Mock).mockResolvedValue(mockResult);

      const result = await repository.getUserRank(3);

      expect(result).toEqual({
        id: 3,
        rank: 10,
        amount: '500.00',
        referralCount: 0,
      });
    });

    it('should handle database errors gracefully', async () => {
      (repository.query as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(repository.getUserRank(1)).rejects.toThrow('Database error');
    });

    it('should use correct SQL query structure', async () => {
      (repository.query as jest.Mock).mockResolvedValue([]);

      await repository.getUserRank(123);

      const [query, params] = (repository.query as jest.Mock).mock.calls[0];

      // Verify the query structure
      expect(query).toContain('SELECT');
      expect(query).toContain('ranked_users.user_id as "userId"');
      expect(query).toContain('RANK() OVER (ORDER BY CAST(up.amount AS DECIMAL) DESC)');
      expect(query).toContain('FROM user_points up');
      expect(query).toContain('LEFT JOIN user_referrals ur');
      expect(query).toContain('WHERE ranked_users.user_id = $1');
      
      // Verify parameters
      expect(params).toEqual([123]);
    });

    it('should calculate rank across all users before filtering', async () => {
      // This test verifies that the query structure calculates ranks for all users
      // in the subquery before filtering for the specific user
      (repository.query as jest.Mock).mockResolvedValue([]);

      await repository.getUserRank(456);

      const [query] = (repository.query as jest.Mock).mock.calls[0];

      // The query should have a subquery that calculates ranks for all users
      expect(query).toContain('FROM (');
      expect(query).toContain(') ranked_users');
      expect(query).toContain('WHERE ranked_users.user_id = $1');
      
      // The RANK() function should be in the subquery, not after the WHERE clause
      const rankPosition = query.indexOf('RANK()');
      const wherePosition = query.indexOf('WHERE ranked_users.user_id');
      expect(rankPosition).toBeLessThan(wherePosition);
    });
  });
});
