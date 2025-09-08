import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserQuestService } from './user-quest.service';
import { UserQuestRepository } from '../../../database/repositories/user-quest.repository';
import { ZealyQuestRepository } from '../../../database/repositories/zealy-quest.repository';
import { ZealyUserQuestRepository } from '../../../database/repositories/zealy-user-quest.repository';
import { UserPointService } from '../../user-point/services/user-point.service';
import { UserReferralService } from '../../user-referral/user-referral.service';
import { SwapService } from '../../swap/swap.service';
import { QuestService } from './quest.service';
import { LoggerService } from '../../../shared/modules/loggers/logger.service';
import { RabbitMQService } from '../../../shared/modules/rabbitmq/rabbitmq.service';
import { UserService } from '../../user/user.service';
import {
  EZealyQuestCategory,
  EZealyQuestType,
  EZealyQuestStatus,
  ZealyQuestEntity,
  IZealyReferralCheckRequirement,
  IZealyTradeCheckRequirement,
} from '../../../database/entities/zealy-quest.entity';
import { EZealyUserQuestStatus, ZealyUserQuestEntity } from '../../../database/entities/zealy-user-quest.entity';
import { ZealyWebhookPayload } from '../interfaces/zealy-webhook.interface';

describe('UserQuestService - Zealy Quest Tests', () => {
  let service: UserQuestService;
  let zealyQuestRepository: jest.Mocked<ZealyQuestRepository>;
  let zealyUserQuestRepository: jest.Mocked<ZealyUserQuestRepository>;
  let userReferralService: jest.Mocked<UserReferralService>;
  let swapService: jest.Mocked<SwapService>;
  let userService: jest.Mocked<UserService>;
  let configService: jest.Mocked<ConfigService>;
  let loggerService: jest.Mocked<LoggerService>;

  const mockLogger = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserQuestService,
        {
          provide: UserQuestRepository,
          useValue: { create: jest.fn(), save: jest.fn(), find: jest.fn(), findOne: jest.fn(), count: jest.fn() },
        },
        {
          provide: ZealyQuestRepository,
          useValue: { findOne: jest.fn() },
        },
        {
          provide: ZealyUserQuestRepository,
          useValue: { create: jest.fn(), save: jest.fn(), findOne: jest.fn() },
        },
        {
          provide: UserPointService,
          useValue: { emitUserPointChangeEvent: jest.fn() },
        },
        {
          provide: UserReferralService,
          useValue: { getReferralCount: jest.fn() },
        },
        {
          provide: SwapService,
          useValue: { getTotalTokenTraded: jest.fn() },
        },
        {
          provide: QuestService,
          useValue: { getQuestById: jest.fn() },
        },
        {
          provide: LoggerService,
          useValue: { getLogger: jest.fn(() => mockLogger) },
        },
        {
          provide: RabbitMQService,
          useValue: { emitToCore: jest.fn() },
        },
        {
          provide: UserService,
          useValue: { getUserByWalletAddress: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<UserQuestService>(UserQuestService);
    zealyQuestRepository = module.get(ZealyQuestRepository);
    zealyUserQuestRepository = module.get(ZealyUserQuestRepository);
    userReferralService = module.get(UserReferralService);
    swapService = module.get(SwapService);
    userService = module.get(UserService);
    configService = module.get(ConfigService);
    loggerService = module.get(LoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleZealyWebhook', () => {
    const mockPayload: ZealyWebhookPayload = {
      userId: 'zealy_123',
      communityId: 'spidex_community',
      subdomain: 'spidex',
      questId: 'quest_456',
      requestId: 'req_789',
      accounts: {
        wallet: '0x123456789abcdef',
      },
    };

    const mockUser = { id: 1, walletAddress: '0x123456789abcdef' };
    const mockZealyQuest: ZealyQuestEntity = {
      id: 1,
      zealyQuestId: 'quest_456',
      name: 'Refer 2 Friends',
      category: EZealyQuestCategory.ONE_TIME,
      type: EZealyQuestType.REFERRAL_CHECK,
      requirements: { referralCount: 2 } as IZealyReferralCheckRequirement,
      status: EZealyQuestStatus.ACTIVE,
      hasDuration: false,
      startDate: null,
      endDate: null,
    } as ZealyQuestEntity;

    beforeEach(() => {
      configService.get.mockReturnValue('valid_api_key');
    });

    it('should throw UnauthorizedException for invalid API key', async () => {
      configService.get.mockReturnValue('valid_api_key');

      await expect(service.handleZealyWebhook(mockPayload, 'invalid_key')).rejects.toThrow(UnauthorizedException);
    });

    it('should return quest not found for non-existent quest', async () => {
      zealyQuestRepository.findOne.mockResolvedValue(null);

      const result = await service.handleZealyWebhook(mockPayload, 'valid_api_key');

      expect(result).toEqual({ success: false, message: 'Quest not found' });
      expect(zealyQuestRepository.findOne).toHaveBeenCalledWith({
        where: {
          zealyQuestId: 'quest_456',
          status: EZealyQuestStatus.ACTIVE,
        },
      });
    });

    it('should return user not found when wallet address has no associated user', async () => {
      zealyQuestRepository.findOne.mockResolvedValue(mockZealyQuest);
      userService.getUserByWalletAddress.mockResolvedValue(null);

      const result = await service.handleZealyWebhook(mockPayload, 'valid_api_key');

      expect(result).toEqual({ success: false, message: 'User not found in Spidex' });
    });

    it('should complete referral quest successfully', async () => {
      zealyQuestRepository.findOne.mockResolvedValue(mockZealyQuest);
      userService.getUserByWalletAddress.mockResolvedValue(mockUser);
      userReferralService.getReferralCount.mockResolvedValue(3); // More than required 2
      zealyUserQuestRepository.create.mockReturnValue({} as ZealyUserQuestEntity);
      zealyUserQuestRepository.save.mockResolvedValue({} as ZealyUserQuestEntity);

      const result = await service.handleZealyWebhook(mockPayload, 'valid_api_key');

      expect(result).toEqual({ success: true, message: 'Quest completed' });
      expect(userReferralService.getReferralCount).toHaveBeenCalledWith(1);
      expect(zealyUserQuestRepository.create).toHaveBeenCalledWith({
        userId: 1,
        zealyQuestId: 1,
        zealyUserId: 'zealy_123',
        zealyRequestId: 'req_789',
        status: EZealyUserQuestStatus.COMPLETED,
        verifiedAt: expect.any(Date),
      });
    });

    it('should fail referral quest when requirements not met', async () => {
      zealyQuestRepository.findOne.mockResolvedValue(mockZealyQuest);
      userService.getUserByWalletAddress.mockResolvedValue(mockUser);
      userReferralService.getReferralCount.mockResolvedValue(1); // Less than required 2

      const result = await service.handleZealyWebhook(mockPayload, 'valid_api_key');

      expect(result).toEqual({
        success: false,
        message: 'Referral quest not completed. Current referrals: 1, required: 2',
      });
    });

    it('should complete trade quest successfully', async () => {
      const tradeQuest: ZealyQuestEntity = {
        ...mockZealyQuest,
        type: EZealyQuestType.TRADE_CHECK,
        requirements: { amount: 50, token: 'MIN' } as IZealyTradeCheckRequirement,
      };

      zealyQuestRepository.findOne.mockResolvedValue(tradeQuest);
      userService.getUserByWalletAddress.mockResolvedValue(mockUser);
      swapService.getTotalTokenTraded.mockResolvedValue(75); // More than required 50
      zealyUserQuestRepository.create.mockReturnValue({} as ZealyUserQuestEntity);
      zealyUserQuestRepository.save.mockResolvedValue({} as ZealyUserQuestEntity);

      const result = await service.handleZealyWebhook(mockPayload, 'valid_api_key');

      expect(result).toEqual({ success: true, message: 'Quest completed' });
      expect(swapService.getTotalTokenTraded).toHaveBeenCalledWith(1, 'MIN');
    });

    it('should fail trade quest when requirements not met', async () => {
      const tradeQuest: ZealyQuestEntity = {
        ...mockZealyQuest,
        type: EZealyQuestType.TRADE_CHECK,
        requirements: { amount: 50, token: 'MIN' } as IZealyTradeCheckRequirement,
      };

      zealyQuestRepository.findOne.mockResolvedValue(tradeQuest);
      userService.getUserByWalletAddress.mockResolvedValue(mockUser);
      swapService.getTotalTokenTraded.mockResolvedValue(25); // Less than required 50

      const result = await service.handleZealyWebhook(mockPayload, 'valid_api_key');

      expect(result).toEqual({
        success: false,
        message: 'Trade quest not completed. Current traded MIN: 25, required: 50',
      });
    });
  });

  describe('Category-based completion rules', () => {
    const mockUser = { id: 1 };
    const baseQuest: ZealyQuestEntity = {
      id: 1,
      zealyQuestId: 'quest_456',
      name: 'Test Quest',
      type: EZealyQuestType.REFERRAL_CHECK,
      requirements: { referralCount: 2 } as IZealyReferralCheckRequirement,
      status: EZealyQuestStatus.ACTIVE,
      hasDuration: false,
      startDate: null,
      endDate: null,
    } as ZealyQuestEntity;

    describe('ONE_TIME quests', () => {
      it('should allow completion if never completed before', async () => {
        const oneTimeQuest = { ...baseQuest, category: EZealyQuestCategory.ONE_TIME };
        zealyUserQuestRepository.findOne.mockResolvedValue(null);

        const result = await service['canCompleteOneTimeZealyQuest'](mockUser.id, oneTimeQuest);

        expect(result).toEqual({ allowed: true });
      });

      it('should prevent completion if already completed', async () => {
        const oneTimeQuest = { ...baseQuest, category: EZealyQuestCategory.ONE_TIME };
        const completedQuest = {
          status: EZealyUserQuestStatus.COMPLETED,
        } as ZealyUserQuestEntity;

        zealyUserQuestRepository.findOne.mockResolvedValue(completedQuest);

        const result = await service['canCompleteOneTimeZealyQuest'](mockUser.id, oneTimeQuest);

        expect(result).toEqual({ allowed: false, reason: 'Quest already completed (one-time only)' });
      });
    });

    describe('DAILY quests', () => {
      it('should allow completion if not completed today', async () => {
        const dailyQuest = { ...baseQuest, category: EZealyQuestCategory.DAILY };
        zealyUserQuestRepository.findOne.mockResolvedValue(null);

        const result = await service['canCompleteDailyZealyQuest'](mockUser.id, dailyQuest);

        expect(result).toEqual({ allowed: true });
      });

      it('should prevent completion if already completed today', async () => {
        const dailyQuest = { ...baseQuest, category: EZealyQuestCategory.DAILY };
        const todayCompletion = {
          status: EZealyUserQuestStatus.COMPLETED,
          createdAt: new Date(),
        } as ZealyUserQuestEntity;

        zealyUserQuestRepository.findOne.mockResolvedValue(todayCompletion);

        const result = await service['canCompleteDailyZealyQuest'](mockUser.id, dailyQuest);

        expect(result).toEqual({ allowed: false, reason: 'Quest already completed today' });
      });
    });

    describe('MULTI_TIME quests', () => {
      it('should always allow completion', async () => {
        const multiTimeQuest = { ...baseQuest, category: EZealyQuestCategory.MULTI_TIME };

        const result = await service['canCompleteMultiTimeZealyQuest'](mockUser.id, multiTimeQuest);

        expect(result).toEqual({ allowed: true });
      });
    });
  });

  describe('Quest verification methods', () => {
    const mockUser = { id: 1 };

    describe('verifyReferralQuest', () => {
      it('should return success when referral requirement is met', async () => {
        const referralQuest: ZealyQuestEntity = {
          requirements: { referralCount: 2 } as IZealyReferralCheckRequirement,
        } as ZealyQuestEntity;

        userReferralService.getReferralCount.mockResolvedValue(3);

        const result = await service['verifyReferralQuest'](mockUser.id, referralQuest);

        expect(result).toEqual({ success: true });
        expect(userReferralService.getReferralCount).toHaveBeenCalledWith(mockUser.id);
      });

      it('should return failure when referral requirement is not met', async () => {
        const referralQuest: ZealyQuestEntity = {
          requirements: { referralCount: 2 } as IZealyReferralCheckRequirement,
        } as ZealyQuestEntity;

        userReferralService.getReferralCount.mockResolvedValue(1);

        const result = await service['verifyReferralQuest'](mockUser.id, referralQuest);

        expect(result).toEqual({
          success: false,
          message: 'Referral quest not completed. Current referrals: 1, required: 2',
        });
      });

      it('should handle errors gracefully', async () => {
        const referralQuest: ZealyQuestEntity = {
          id: 1,
          requirements: { referralCount: 2 } as IZealyReferralCheckRequirement,
        } as ZealyQuestEntity;

        const error = new Error('Database error');
        userReferralService.getReferralCount.mockRejectedValue(error);

        const result = await service['verifyReferralQuest'](mockUser.id, referralQuest);

        expect(result).toEqual({
          success: false,
          message: 'Error checking referral count: Database error',
        });
        expect(mockLogger.error).toHaveBeenCalledWith('Error verifying referral quest: Database error', {
          userId: mockUser.id,
          zealyQuest: 1,
        });
      });
    });

    describe('verifyTradeQuest', () => {
      it('should return success when trade requirement is met', async () => {
        const tradeQuest: ZealyQuestEntity = {
          requirements: { amount: 50, token: 'MIN' } as IZealyTradeCheckRequirement,
        } as ZealyQuestEntity;

        swapService.getTotalTokenTraded.mockResolvedValue(75);

        const result = await service['verifyTradeQuest'](mockUser.id, tradeQuest);

        expect(result).toEqual({ success: true });
        expect(swapService.getTotalTokenTraded).toHaveBeenCalledWith(mockUser.id, 'MIN');
      });

      it('should return failure when trade requirement is not met', async () => {
        const tradeQuest: ZealyQuestEntity = {
          requirements: { amount: 50, token: 'MIN' } as IZealyTradeCheckRequirement,
        } as ZealyQuestEntity;

        swapService.getTotalTokenTraded.mockResolvedValue(25);

        const result = await service['verifyTradeQuest'](mockUser.id, tradeQuest);

        expect(result).toEqual({
          success: false,
          message: 'Trade quest not completed. Current traded MIN: 25, required: 50',
        });
      });

      it('should handle errors gracefully', async () => {
        const tradeQuest: ZealyQuestEntity = {
          id: 1,
          requirements: { amount: 50, token: 'MIN' } as IZealyTradeCheckRequirement,
        } as ZealyQuestEntity;

        const error = new Error('Service error');
        swapService.getTotalTokenTraded.mockRejectedValue(error);

        const result = await service['verifyTradeQuest'](mockUser.id, tradeQuest);

        expect(result).toEqual({
          success: false,
          message: 'Error checking trade volume: Service error',
        });
        expect(mockLogger.error).toHaveBeenCalledWith('Error verifying trade quest: Service error', {
          userId: mockUser.id,
          zealyQuest: 1,
        });
      });
    });
  });
});
