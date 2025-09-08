import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource, Repository } from 'typeorm';
import {
  ZealyQuestEntity,
  EZealyQuestCategory,
  EZealyQuestType,
  EZealyQuestStatus,
} from '../src/database/entities/zealy-quest.entity';
import { ZealyUserQuestEntity, EZealyUserQuestStatus } from '../src/database/entities/zealy-user-quest.entity';
import { UserEntity } from '../src/database/entities/user.entity';
import { UserReferralEntity } from '../src/database/entities/user-referral.entity';
import { SwapTransactionEntity, SwapAction, SwapStatus } from '../src/database/entities/swap-transaction.entity';
import { ZealyWebhookPayload } from '../src/modules/user-quest/interfaces/zealy-webhook.interface';

describe('Zealy Webhook (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let zealyQuestRepository: Repository<ZealyQuestEntity>;
  let zealyUserQuestRepository: Repository<ZealyUserQuestEntity>;
  let userRepository: Repository<UserEntity>;
  let referralRepository: Repository<UserReferralEntity>;
  let swapRepository: Repository<SwapTransactionEntity>;

  const VALID_API_KEY = 'test_zealy_api_key';
  const WEBHOOK_URL = '/user-quest/zealy/webhook';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    dataSource = moduleFixture.get<DataSource>(DataSource);

    zealyQuestRepository = dataSource.getRepository(ZealyQuestEntity);
    zealyUserQuestRepository = dataSource.getRepository(ZealyUserQuestEntity);
    userRepository = dataSource.getRepository(UserEntity);
    referralRepository = dataSource.getRepository(UserReferralEntity);
    swapRepository = dataSource.getRepository(SwapTransactionEntity);

    // Set environment variables for testing
    process.env.ZEALY_API_KEY = VALID_API_KEY;

    await app.init();
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  beforeEach(async () => {
    // Clean up test data
    await zealyUserQuestRepository.clear();
    await zealyQuestRepository.clear();
    await referralRepository.clear();
    await swapRepository.clear();
    await userRepository.clear();
  });

  describe('POST /user-quest/zealy/webhook', () => {
    const basePayload: ZealyWebhookPayload = {
      userId: 'zealy_user_123',
      communityId: 'spidex_community',
      subdomain: 'spidex',
      questId: 'zealy_quest_456',
      requestId: 'request_789',
      accounts: {
        wallet: '0x123456789abcdef',
      },
    };

    it('should reject request with invalid API key', async () => {
      return request(app.getHttpServer())
        .post(WEBHOOK_URL)
        .set('x-api-key', 'invalid_key')
        .send(basePayload)
        .expect(401);
    });

    it('should return quest not found for non-existent quest', async () => {
      return request(app.getHttpServer())
        .post(WEBHOOK_URL)
        .set('x-api-key', VALID_API_KEY)
        .send(basePayload)
        .expect(200)
        .expect(res => {
          expect(res.body).toEqual({
            success: false,
            message: 'Quest not found',
          });
        });
    });

    it('should return user not found for non-existent wallet', async () => {
      // Create test quest
      await zealyQuestRepository.save({
        zealyQuestId: 'zealy_quest_456',
        name: 'Test Quest',
        category: EZealyQuestCategory.ONE_TIME,
        type: EZealyQuestType.REFERRAL_CHECK,
        requirements: { referralCount: 2 },
        status: EZealyQuestStatus.ACTIVE,
        hasDuration: false,
      });

      return request(app.getHttpServer())
        .post(WEBHOOK_URL)
        .set('x-api-key', VALID_API_KEY)
        .send(basePayload)
        .expect(200)
        .expect(res => {
          expect(res.body).toEqual({
            success: false,
            message: 'User not found in Spidex',
          });
        });
    });

    describe('Referral Quest Tests', () => {
      let testUser: UserEntity;
      let referralQuest: ZealyQuestEntity;

      beforeEach(async () => {
        // Create test user
        testUser = await userRepository.save({
          walletAddress: '0x123456789abcdef',
          email: 'test@example.com',
        });

        // Create referral quest
        referralQuest = await zealyQuestRepository.save({
          zealyQuestId: 'zealy_quest_456',
          name: 'Refer 2 Friends',
          category: EZealyQuestCategory.ONE_TIME,
          type: EZealyQuestType.REFERRAL_CHECK,
          requirements: { referralCount: 2 },
          status: EZealyQuestStatus.ACTIVE,
          hasDuration: false,
        });
      });

      it('should complete referral quest when requirements are met', async () => {
        // Create referrals for the user
        await referralRepository.save([
          { referredBy: testUser.id, referredUserId: 100, code: 'REF1' },
          { referredBy: testUser.id, referredUserId: 101, code: 'REF2' },
          { referredBy: testUser.id, referredUserId: 102, code: 'REF3' },
        ]);

        return request(app.getHttpServer())
          .post(WEBHOOK_URL)
          .set('x-api-key', VALID_API_KEY)
          .send(basePayload)
          .expect(200)
          .expect(res => {
            expect(res.body).toEqual({
              success: true,
              message: 'Quest completed',
            });
          });
      });

      it('should fail referral quest when requirements are not met', async () => {
        // Create only 1 referral (less than required 2)
        await referralRepository.save({
          referredBy: testUser.id,
          referredUserId: 100,
          code: 'REF1',
        });

        return request(app.getHttpServer())
          .post(WEBHOOK_URL)
          .set('x-api-key', VALID_API_KEY)
          .send(basePayload)
          .expect(200)
          .expect(res => {
            expect(res.body).toEqual({
              success: false,
              message: 'Referral quest not completed. Current referrals: 1, required: 2',
            });
          });
      });

      it('should prevent duplicate completion of one-time quest', async () => {
        // Create referrals
        await referralRepository.save([
          { referredBy: testUser.id, referredUserId: 100, code: 'REF1' },
          { referredBy: testUser.id, referredUserId: 101, code: 'REF2' },
        ]);

        // First completion
        await request(app.getHttpServer())
          .post(WEBHOOK_URL)
          .set('x-api-key', VALID_API_KEY)
          .send(basePayload)
          .expect(200)
          .expect(res => {
            expect(res.body.success).toBe(true);
          });

        // Second attempt should be prevented
        await request(app.getHttpServer())
          .post(WEBHOOK_URL)
          .set('x-api-key', VALID_API_KEY)
          .send({ ...basePayload, requestId: 'request_890' })
          .expect(200)
          .expect(res => {
            expect(res.body).toEqual({
              success: false,
              message: 'Quest already completed (one-time only)',
            });
          });
      });
    });

    describe('Trade Quest Tests', () => {
      let testUser: UserEntity;
      let tradeQuest: ZealyQuestEntity;

      beforeEach(async () => {
        // Create test user
        testUser = await userRepository.save({
          walletAddress: '0x123456789abcdef',
          email: 'test@example.com',
        });

        // Create trade quest
        tradeQuest = await zealyQuestRepository.save({
          zealyQuestId: 'zealy_quest_456',
          name: 'Trade 50 MIN',
          category: EZealyQuestCategory.ONE_TIME,
          type: EZealyQuestType.TRADE_CHECK,
          requirements: { amount: 50, token: 'MIN' },
          status: EZealyQuestStatus.ACTIVE,
          hasDuration: false,
        });
      });

      it('should complete trade quest when requirements are met', async () => {
        // Create swap transactions for MIN token
        await swapRepository.save([
          {
            userId: testUser.id,
            tokenAName: 'ADA',
            tokenAAmount: '100.0',
            tokenBName: 'MIN',
            tokenBAmount: '30.0',
            address: testUser.walletAddress,
            exchange: 'minswap',
            action: SwapAction.BUY,
            status: SwapStatus.SUCCESS,
            totalFee: 1.0,
            totalUsd: '100.0',
            cborHex: '0x123',
          },
          {
            userId: testUser.id,
            tokenAName: 'MIN',
            tokenAAmount: '25.0',
            tokenBName: 'ADA',
            tokenBAmount: '80.0',
            address: testUser.walletAddress,
            exchange: 'minswap',
            action: SwapAction.SELL,
            status: SwapStatus.SUCCESS,
            totalFee: 1.0,
            totalUsd: '80.0',
            cborHex: '0x456',
          },
        ]);

        return request(app.getHttpServer())
          .post(WEBHOOK_URL)
          .set('x-api-key', VALID_API_KEY)
          .send(basePayload)
          .expect(200)
          .expect(res => {
            expect(res.body).toEqual({
              success: true,
              message: 'Quest completed',
            });
          });
      });

      it('should fail trade quest when requirements are not met', async () => {
        // Create insufficient trading volume
        await swapRepository.save({
          userId: testUser.id,
          tokenAName: 'ADA',
          tokenAAmount: '50.0',
          tokenBName: 'MIN',
          tokenBAmount: '20.0', // Less than required 50
          address: testUser.walletAddress,
          exchange: 'minswap',
          action: SwapAction.BUY,
          status: SwapStatus.SUCCESS,
          totalFee: 1.0,
          totalUsd: '40.0',
          cborHex: '0x123',
        });

        return request(app.getHttpServer())
          .post(WEBHOOK_URL)
          .set('x-api-key', VALID_API_KEY)
          .send(basePayload)
          .expect(200)
          .expect(res => {
            expect(res.body).toEqual({
              success: false,
              message: 'Trade quest not completed. Current traded MIN: 20, required: 50',
            });
          });
      });
    });

    describe('Daily Quest Tests', () => {
      let testUser: UserEntity;
      let dailyQuest: ZealyQuestEntity;

      beforeEach(async () => {
        // Create test user
        testUser = await userRepository.save({
          walletAddress: '0x123456789abcdef',
          email: 'test@example.com',
        });

        // Create daily referral quest
        dailyQuest = await zealyQuestRepository.save({
          zealyQuestId: 'zealy_quest_456',
          name: 'Daily Refer Friend',
          category: EZealyQuestCategory.DAILY,
          type: EZealyQuestType.REFERRAL_CHECK,
          requirements: { referralCount: 1 },
          status: EZealyQuestStatus.ACTIVE,
          hasDuration: false,
        });

        // Create referral for the user
        await referralRepository.save({
          referredBy: testUser.id,
          referredUserId: 100,
          code: 'REF1',
        });
      });

      it('should allow daily quest completion', async () => {
        return request(app.getHttpServer())
          .post(WEBHOOK_URL)
          .set('x-api-key', VALID_API_KEY)
          .send(basePayload)
          .expect(200)
          .expect(res => {
            expect(res.body).toEqual({
              success: true,
              message: 'Quest completed',
            });
          });
      });

      it('should prevent duplicate completion on same day', async () => {
        // First completion
        await request(app.getHttpServer())
          .post(WEBHOOK_URL)
          .set('x-api-key', VALID_API_KEY)
          .send(basePayload)
          .expect(200);

        // Second attempt on same day should be prevented
        await request(app.getHttpServer())
          .post(WEBHOOK_URL)
          .set('x-api-key', VALID_API_KEY)
          .send({ ...basePayload, requestId: 'request_890' })
          .expect(200)
          .expect(res => {
            expect(res.body).toEqual({
              success: false,
              message: 'Quest already completed today',
            });
          });
      });
    });

    describe('Multi-time Quest Tests', () => {
      let testUser: UserEntity;
      let multiTimeQuest: ZealyQuestEntity;

      beforeEach(async () => {
        // Create test user
        testUser = await userRepository.save({
          walletAddress: '0x123456789abcdef',
          email: 'test@example.com',
        });

        // Create multi-time referral quest
        multiTimeQuest = await zealyQuestRepository.save({
          zealyQuestId: 'zealy_quest_456',
          name: 'Multi Refer Friend',
          category: EZealyQuestCategory.MULTI_TIME,
          type: EZealyQuestType.REFERRAL_CHECK,
          requirements: { referralCount: 1 },
          status: EZealyQuestStatus.ACTIVE,
          hasDuration: false,
        });

        // Create referral for the user
        await referralRepository.save({
          referredBy: testUser.id,
          referredUserId: 100,
          code: 'REF1',
        });
      });

      it('should allow multiple completions of multi-time quest', async () => {
        // First completion
        await request(app.getHttpServer())
          .post(WEBHOOK_URL)
          .set('x-api-key', VALID_API_KEY)
          .send(basePayload)
          .expect(200)
          .expect(res => {
            expect(res.body.success).toBe(true);
          });

        // Second completion should also be allowed
        await request(app.getHttpServer())
          .post(WEBHOOK_URL)
          .set('x-api-key', VALID_API_KEY)
          .send({ ...basePayload, requestId: 'request_890' })
          .expect(200)
          .expect(res => {
            expect(res.body).toEqual({
              success: true,
              message: 'Quest completed',
            });
          });
      });
    });

    describe('Duration-based Quest Tests', () => {
      let testUser: UserEntity;

      beforeEach(async () => {
        // Create test user
        testUser = await userRepository.save({
          walletAddress: '0x123456789abcdef',
          email: 'test@example.com',
        });

        // Create referral for the user
        await referralRepository.save({
          referredBy: testUser.id,
          referredUserId: 100,
          code: 'REF1',
        });
      });

      it('should reject quest before start date', async () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 1);

        await zealyQuestRepository.save({
          zealyQuestId: 'zealy_quest_456',
          name: 'Future Quest',
          category: EZealyQuestCategory.ONE_TIME,
          type: EZealyQuestType.REFERRAL_CHECK,
          requirements: { referralCount: 1 },
          status: EZealyQuestStatus.ACTIVE,
          hasDuration: true,
          startDate: futureDate,
          endDate: new Date(futureDate.getTime() + 24 * 60 * 60 * 1000),
        });

        return request(app.getHttpServer())
          .post(WEBHOOK_URL)
          .set('x-api-key', VALID_API_KEY)
          .send(basePayload)
          .expect(200)
          .expect(res => {
            expect(res.body).toEqual({
              success: false,
              message: 'Quest not started yet',
            });
          });
      });

      it('should reject quest after end date', async () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 2);

        await zealyQuestRepository.save({
          zealyQuestId: 'zealy_quest_456',
          name: 'Expired Quest',
          category: EZealyQuestCategory.ONE_TIME,
          type: EZealyQuestType.REFERRAL_CHECK,
          requirements: { referralCount: 1 },
          status: EZealyQuestStatus.ACTIVE,
          hasDuration: true,
          startDate: new Date(pastDate.getTime() - 24 * 60 * 60 * 1000),
          endDate: pastDate,
        });

        return request(app.getHttpServer())
          .post(WEBHOOK_URL)
          .set('x-api-key', VALID_API_KEY)
          .send(basePayload)
          .expect(200)
          .expect(res => {
            expect(res.body).toEqual({
              success: false,
              message: 'Quest expired',
            });
          });
      });

      it('should accept quest within duration', async () => {
        const startDate = new Date();
        startDate.setHours(startDate.getHours() - 1);
        const endDate = new Date();
        endDate.setHours(endDate.getHours() + 1);

        await zealyQuestRepository.save({
          zealyQuestId: 'zealy_quest_456',
          name: 'Active Quest',
          category: EZealyQuestCategory.ONE_TIME,
          type: EZealyQuestType.REFERRAL_CHECK,
          requirements: { referralCount: 1 },
          status: EZealyQuestStatus.ACTIVE,
          hasDuration: true,
          startDate,
          endDate,
        });

        return request(app.getHttpServer())
          .post(WEBHOOK_URL)
          .set('x-api-key', VALID_API_KEY)
          .send(basePayload)
          .expect(200)
          .expect(res => {
            expect(res.body).toEqual({
              success: true,
              message: 'Quest completed',
            });
          });
      });
    });
  });
});
