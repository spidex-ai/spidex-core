import { Repository } from 'typeorm';
import { ZealyQuestEntity } from '../../src/database/entities/zealy-quest.entity';
import { ZealyUserQuestEntity } from '../../src/database/entities/zealy-user-quest.entity';
import { UserEntity } from '../../src/database/entities/user.entity';
import { UserReferralEntity } from '../../src/database/entities/user-referral.entity';
import { SwapTransactionEntity } from '../../src/database/entities/swap-transaction.entity';

export class ZealyTestHelper {
  constructor(
    private readonly zealyQuestRepository: Repository<ZealyQuestEntity>,
    private readonly zealyUserQuestRepository: Repository<ZealyUserQuestEntity>,
    private readonly userRepository: Repository<UserEntity>,
    private readonly referralRepository: Repository<UserReferralEntity>,
    private readonly swapRepository: Repository<SwapTransactionEntity>,
  ) {}

  /**
   * Clean up all test data
   */
  async cleanupTestData(): Promise<void> {
    await this.zealyUserQuestRepository.clear();
    await this.zealyQuestRepository.clear();
    await this.referralRepository.clear();
    await this.swapRepository.clear();
    await this.userRepository.clear();
  }

  /**
   * Create a test user with wallet address
   */
  async createTestUser(
    walletAddress: string = '0x123456789abcdef',
    email: string = 'test@example.com',
  ): Promise<UserEntity> {
    return this.userRepository.save({
      walletAddress,
      email,
    });
  }

  /**
   * Create referrals for a user
   */
  async createReferralsForUser(userId: number, count: number): Promise<UserReferralEntity[]> {
    const referrals: Partial<UserReferralEntity>[] = [];

    for (let i = 0; i < count; i++) {
      referrals.push({
        referredBy: userId,
        referredUserId: 1000 + i, // Use predictable user IDs
        code: `REF${i + 1}`,
      });
    }

    return this.referralRepository.save(referrals);
  }

  /**
   * Create swap transactions for a user with specific token and total amount
   */
  async createSwapTransactionsForUser(
    userId: number,
    walletAddress: string,
    tokenSymbol: string,
    totalAmount: number,
    transactionCount: number = 2,
  ): Promise<SwapTransactionEntity[]> {
    const transactions: Partial<SwapTransactionEntity>[] = [];
    const amountPerTransaction = totalAmount / transactionCount;

    for (let i = 0; i < transactionCount; i++) {
      // Create transactions where user both buys and sells the token
      if (i % 2 === 0) {
        // Buy transaction (tokenB is the target token)
        transactions.push({
          userId,
          tokenAName: 'ADA',
          tokenBName: tokenSymbol,
          tokenBAmount: amountPerTransaction.toString(),
          address: walletAddress,
          exchange: 'minswap',
          action: 'swap',
          status: 'completed',
          totalFee: 1.0,
          totalUsd: (amountPerTransaction * 2).toString(), // Rough USD value
          cborHex: `0x${(i + 1).toString(16).padStart(6, '0')}`,
        });
      } else {
        // Sell transaction (tokenA is the target token)
        transactions.push({
          userId,
          tokenAName: tokenSymbol,
          tokenBName: 'ADA',
          tokenAAmount: amountPerTransaction.toString(),
          address: walletAddress,
          exchange: 'minswap',
          action: 'swap',
          status: 'completed',
          totalFee: 1.0,
          totalUsd: (amountPerTransaction * 2).toString(),
          cborHex: `0x${(i + 1).toString(16).padStart(6, '0')}`,
        });
      }
    }

    return this.swapRepository.save(transactions);
  }

  /**
   * Create a completed quest attempt for a user
   */
  async createCompletedQuestAttempt(
    userId: number,
    zealyQuestId: number,
    zealyUserId: string,
    requestId: string,
  ): Promise<ZealyUserQuestEntity> {
    return this.zealyUserQuestRepository.save({
      userId,
      zealyQuestId,
      zealyUserId,
      zealyRequestId: requestId,
      status: 0, // EZealyUserQuestStatus.COMPLETED
      verifiedAt: new Date(),
    });
  }

  /**
   * Check if a quest attempt exists
   */
  async questAttemptExists(userId: number, zealyQuestId: number, requestId: string): Promise<boolean> {
    const attempt = await this.zealyUserQuestRepository.findOne({
      where: {
        userId,
        zealyQuestId,
        zealyRequestId: requestId,
      },
    });

    return attempt !== null;
  }

  /**
   * Get quest attempt by criteria
   */
  async getQuestAttempt(userId: number, zealyQuestId: number, requestId: string): Promise<ZealyUserQuestEntity | null> {
    return this.zealyUserQuestRepository.findOne({
      where: {
        userId,
        zealyQuestId,
        zealyRequestId: requestId,
      },
    });
  }

  /**
   * Count completed quests for a user
   */
  async getCompletedQuestCount(userId: number, zealyQuestId: number): Promise<number> {
    return this.zealyUserQuestRepository.count({
      where: {
        userId,
        zealyQuestId,
        status: 0, // EZealyUserQuestStatus.COMPLETED
      },
    });
  }

  /**
   * Simulate time passing (useful for daily quest tests)
   */
  mockCurrentDate(date: Date): void {
    jest.useFakeTimers();
    jest.setSystemTime(date);
  }

  /**
   * Restore real timers
   */
  restoreTime(): void {
    jest.useRealTimers();
  }
}

export const createZealyTestHelper = (repositories: {
  zealyQuestRepository: Repository<ZealyQuestEntity>;
  zealyUserQuestRepository: Repository<ZealyUserQuestEntity>;
  userRepository: Repository<UserEntity>;
  referralRepository: Repository<UserReferralEntity>;
  swapRepository: Repository<SwapTransactionEntity>;
}) => {
  return new ZealyTestHelper(
    repositories.zealyQuestRepository,
    repositories.zealyUserQuestRepository,
    repositories.userRepository,
    repositories.referralRepository,
    repositories.swapRepository,
  );
};
