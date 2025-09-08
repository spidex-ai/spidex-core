import {
  ZealyQuestEntity,
  EZealyQuestCategory,
  EZealyQuestType,
  EZealyQuestStatus,
  IZealyReferralCheckRequirement,
  IZealyTradeCheckRequirement,
} from '../../src/database/entities/zealy-quest.entity';
import { ZealyUserQuestEntity, EZealyUserQuestStatus } from '../../src/database/entities/zealy-user-quest.entity';
import { ZealyWebhookPayload } from '../../src/modules/user-quest/interfaces/zealy-webhook.interface';

export class ZealyQuestFixtures {
  static createReferralQuest(overrides: Partial<ZealyQuestEntity> = {}): ZealyQuestEntity {
    const quest = new ZealyQuestEntity();
    quest.id = 1;
    quest.zealyQuestId = 'zealy_referral_123';
    quest.name = 'Refer 2 Friends';
    quest.category = EZealyQuestCategory.ONE_TIME;
    quest.type = EZealyQuestType.REFERRAL_CHECK;
    quest.requirements = { referralCount: 2 } as IZealyReferralCheckRequirement;
    quest.status = EZealyQuestStatus.ACTIVE;
    quest.hasDuration = false;
    quest.startDate = null;
    quest.endDate = null;
    quest.zealyUserQuests = [];
    quest.createdAt = new Date();
    quest.updatedAt = new Date();
    quest.deletedAt = null;

    return Object.assign(quest, overrides);
  }

  static createTradeQuest(overrides: Partial<ZealyQuestEntity> = {}): ZealyQuestEntity {
    const quest = new ZealyQuestEntity();
    quest.id = 2;
    quest.zealyQuestId = 'zealy_trade_456';
    quest.name = 'Trade 50 MIN Tokens';
    quest.category = EZealyQuestCategory.ONE_TIME;
    quest.type = EZealyQuestType.TRADE_CHECK;
    quest.requirements = { amount: 50, token: 'MIN' } as IZealyTradeCheckRequirement;
    quest.status = EZealyQuestStatus.ACTIVE;
    quest.hasDuration = false;
    quest.startDate = null;
    quest.endDate = null;
    quest.zealyUserQuests = [];
    quest.createdAt = new Date();
    quest.updatedAt = new Date();
    quest.deletedAt = null;

    return Object.assign(quest, overrides);
  }

  static createDailyReferralQuest(overrides: Partial<ZealyQuestEntity> = {}): ZealyQuestEntity {
    return this.createReferralQuest({
      id: 3,
      zealyQuestId: 'zealy_daily_referral_789',
      name: 'Daily Referral Quest',
      category: EZealyQuestCategory.DAILY,
      requirements: { referralCount: 1 } as IZealyReferralCheckRequirement,
      ...overrides,
    });
  }

  static createMultiTimeTradeQuest(overrides: Partial<ZealyQuestEntity> = {}): ZealyQuestEntity {
    return this.createTradeQuest({
      id: 4,
      zealyQuestId: 'zealy_multi_trade_101',
      name: 'Multi-Time Trade Quest',
      category: EZealyQuestCategory.MULTI_TIME,
      requirements: { amount: 10, token: 'MIN' } as IZealyTradeCheckRequirement,
      ...overrides,
    });
  }

  static createTimedQuest(overrides: Partial<ZealyQuestEntity> = {}): ZealyQuestEntity {
    const now = new Date();
    const startDate = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
    const endDate = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now

    return this.createReferralQuest({
      id: 5,
      zealyQuestId: 'zealy_timed_quest_202',
      name: 'Timed Referral Quest',
      hasDuration: true,
      startDate,
      endDate,
      ...overrides,
    });
  }

  static createUserQuest(overrides: Partial<ZealyUserQuestEntity> = {}): ZealyUserQuestEntity {
    const userQuest = new ZealyUserQuestEntity();
    userQuest.id = 1;
    userQuest.userId = 1;
    userQuest.zealyQuestId = 1;
    userQuest.zealyUserId = 'zealy_user_123';
    userQuest.zealyRequestId = 'request_456';
    userQuest.status = EZealyUserQuestStatus.COMPLETED;
    userQuest.verifiedAt = new Date();
    userQuest.createdAt = new Date();
    userQuest.updatedAt = new Date();
    userQuest.deletedAt = null;

    return Object.assign(userQuest, overrides);
  }

  static createWebhookPayload(overrides: Partial<ZealyWebhookPayload> = {}): ZealyWebhookPayload {
    return {
      userId: 'zealy_user_123',
      communityId: 'spidex_community',
      subdomain: 'spidex',
      questId: 'zealy_referral_123',
      requestId: 'request_456',
      accounts: {
        wallet: '0x123456789abcdef',
      },
      ...overrides,
    };
  }
}

export class ZealyTestScenarios {
  /**
   * Creates a complete test scenario for a successful referral quest
   */
  static successfulReferralQuest() {
    return {
      quest: ZealyQuestFixtures.createReferralQuest(),
      payload: ZealyQuestFixtures.createWebhookPayload({
        questId: 'zealy_referral_123',
      }),
      user: { id: 1, walletAddress: '0x123456789abcdef' },
      referralCount: 3, // More than required 2
      expectedResponse: { success: true, message: 'Quest completed' },
    };
  }

  /**
   * Creates a test scenario for a failed referral quest
   */
  static failedReferralQuest() {
    return {
      quest: ZealyQuestFixtures.createReferralQuest(),
      payload: ZealyQuestFixtures.createWebhookPayload({
        questId: 'zealy_referral_123',
      }),
      user: { id: 1, walletAddress: '0x123456789abcdef' },
      referralCount: 1, // Less than required 2
      expectedResponse: {
        success: false,
        message: 'Referral quest not completed. Current referrals: 1, required: 2',
      },
    };
  }

  /**
   * Creates a complete test scenario for a successful trade quest
   */
  static successfulTradeQuest() {
    return {
      quest: ZealyQuestFixtures.createTradeQuest(),
      payload: ZealyQuestFixtures.createWebhookPayload({
        questId: 'zealy_trade_456',
      }),
      user: { id: 1, walletAddress: '0x123456789abcdef' },
      totalTraded: 75, // More than required 50
      expectedResponse: { success: true, message: 'Quest completed' },
    };
  }

  /**
   * Creates a test scenario for a failed trade quest
   */
  static failedTradeQuest() {
    return {
      quest: ZealyQuestFixtures.createTradeQuest(),
      payload: ZealyQuestFixtures.createWebhookPayload({
        questId: 'zealy_trade_456',
      }),
      user: { id: 1, walletAddress: '0x123456789abcdef' },
      totalTraded: 25, // Less than required 50
      expectedResponse: {
        success: false,
        message: 'Trade quest not completed. Current traded MIN: 25, required: 50',
      },
    };
  }

  /**
   * Creates a test scenario for a quest that's already been completed
   */
  static alreadyCompletedQuest() {
    return {
      quest: ZealyQuestFixtures.createReferralQuest(),
      payload: ZealyQuestFixtures.createWebhookPayload({
        questId: 'zealy_referral_123',
        requestId: 'request_789', // Different request ID
      }),
      user: { id: 1, walletAddress: '0x123456789abcdef' },
      existingUserQuest: ZealyQuestFixtures.createUserQuest({
        status: EZealyUserQuestStatus.COMPLETED,
      }),
      expectedResponse: {
        success: false,
        message: 'Quest already completed (one-time only)',
      },
    };
  }

  /**
   * Creates a test scenario for a daily quest that's already been completed today
   */
  static alreadyCompletedDailyQuest() {
    return {
      quest: ZealyQuestFixtures.createDailyReferralQuest(),
      payload: ZealyQuestFixtures.createWebhookPayload({
        questId: 'zealy_daily_referral_789',
        requestId: 'request_789',
      }),
      user: { id: 1, walletAddress: '0x123456789abcdef' },
      existingUserQuest: ZealyQuestFixtures.createUserQuest({
        zealyQuestId: 3,
        status: EZealyUserQuestStatus.COMPLETED,
        createdAt: new Date(), // Today
      }),
      expectedResponse: {
        success: false,
        message: 'Quest already completed today',
      },
    };
  }

  /**
   * Creates a test scenario for a quest that hasn't started yet
   */
  static questNotStarted() {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);

    return {
      quest: ZealyQuestFixtures.createTimedQuest({
        startDate: futureDate,
        endDate: new Date(futureDate.getTime() + 24 * 60 * 60 * 1000),
      }),
      payload: ZealyQuestFixtures.createWebhookPayload({
        questId: 'zealy_timed_quest_202',
      }),
      expectedResponse: {
        success: false,
        message: 'Quest not started yet',
      },
    };
  }

  /**
   * Creates a test scenario for a quest that has expired
   */
  static questExpired() {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);

    return {
      quest: ZealyQuestFixtures.createTimedQuest({
        startDate: new Date(pastDate.getTime() - 24 * 60 * 60 * 1000),
        endDate: pastDate,
      }),
      payload: ZealyQuestFixtures.createWebhookPayload({
        questId: 'zealy_timed_quest_202',
      }),
      expectedResponse: {
        success: false,
        message: 'Quest expired',
      },
    };
  }
}

export const TEST_CONSTANTS = {
  VALID_API_KEY: 'test_zealy_api_key',
  INVALID_API_KEY: 'invalid_api_key',
  WEBHOOK_ENDPOINT: '/user-quest/zealy/webhook',
  TEST_WALLET_ADDRESS: '0x123456789abcdef',
  TEST_USER_EMAIL: 'test@example.com',
};
