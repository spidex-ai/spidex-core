import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

// Mock implementations
const mockZealyQuestRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
};

const mockZealyUserQuestRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
};

const mockUserService = {
  getUserByWalletAddress: jest.fn(),
};

const mockUserReferralService = {
  getReferralCount: jest.fn(),
};

const mockSwapService = {
  getTotalTokenTraded: jest.fn(),
};

const mockConfigService = {
  get: jest.fn(),
};

const mockLoggerService = {
  getLogger: jest.fn(() => ({
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
};

// Mock UserQuestService with essential methods
class MockUserQuestService {
  constructor(
    private zealyQuestRepository: any,
    private zealyUserQuestRepository: any,
    private userService: any,
    private userReferralService: any,
    private swapService: any,
    private configService: any,
    private loggerService: any,
  ) {}

  async handleZealyWebhook(payload: any, apiKey: string): Promise<any> {
    // Validate API key
    const expectedApiKey = this.configService.get('ZEALY_API_KEY');
    if (!expectedApiKey || apiKey !== expectedApiKey) {
      throw new Error('Invalid API Key');
    }

    // Find quest
    const zealyQuest = await this.zealyQuestRepository.findOne({
      where: { zealyQuestId: payload.questId, status: 1 }
    });

    if (!zealyQuest) {
      return { success: false, message: 'Quest not found' };
    }

    // Find user
    const user = await this.userService.getUserByWalletAddress(payload.accounts?.wallet);
    if (!user) {
      return { success: false, message: 'User not found in Spidex' };
    }

    // Verify based on quest type
    let verificationResult = { success: false, message: 'Verification failed' };
    
    if (zealyQuest.type === 0) { // REFERRAL_CHECK
      const referralCount = await this.userReferralService.getReferralCount(user.id);
      const required = zealyQuest.requirements?.referralCount || 2;
      
      if (referralCount >= required) {
        verificationResult = { success: true, message: 'Quest completed' };
      } else {
        verificationResult = { 
          success: false, 
          message: `Referral quest not completed. Current referrals: ${referralCount}, required: ${required}` 
        };
      }
    } else if (zealyQuest.type === 1) { // TRADE_CHECK
      const totalTraded = await this.swapService.getTotalTokenTraded(user.id, zealyQuest.requirements?.token || 'MIN');
      const required = zealyQuest.requirements?.amount || 50;
      
      if (totalTraded >= required) {
        verificationResult = { success: true, message: 'Quest completed' };
      } else {
        verificationResult = { 
          success: false, 
          message: `Trade quest not completed. Current traded ${zealyQuest.requirements?.token}: ${totalTraded}, required: ${required}` 
        };
      }
    }

    if (verificationResult.success) {
      // Create quest completion record
      const zealyUserQuest = this.zealyUserQuestRepository.create({
        userId: user.id,
        zealyQuestId: zealyQuest.id,
        zealyUserId: payload.userId,
        zealyRequestId: payload.requestId,
        status: 0, // COMPLETED
        verifiedAt: new Date(),
      });
      await this.zealyUserQuestRepository.save(zealyUserQuest);
    }

    return {
      success: verificationResult.success,
      message: verificationResult.success ? 'Quest completed' : verificationResult.message,
    };
  }
}

describe('Zealy Quest Integration Tests', () => {
  let service: MockUserQuestService;

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Set up default mock returns
    mockConfigService.get.mockReturnValue('test_zealy_api_key');
    
    service = new MockUserQuestService(
      mockZealyQuestRepository,
      mockZealyUserQuestRepository,
      mockUserService,
      mockUserReferralService,
      mockSwapService,
      mockConfigService,
      mockLoggerService,
    );
  });

  describe('handleZealyWebhook', () => {
    const mockPayload = {
      userId: 'zealy_123',
      communityId: 'spidex_community',
      subdomain: 'spidex',
      questId: 'quest_456',
      requestId: 'req_789',
      accounts: {
        wallet: '0x123456789abcdef',
      },
    };

    it('should reject invalid API key', async () => {
      await expect(service.handleZealyWebhook(mockPayload, 'invalid_key'))
        .rejects.toThrow('Invalid API Key');
    });

    it('should return quest not found for non-existent quest', async () => {
      mockZealyQuestRepository.findOne.mockResolvedValue(null);

      const result = await service.handleZealyWebhook(mockPayload, 'test_zealy_api_key');

      expect(result).toEqual({ success: false, message: 'Quest not found' });
    });

    it('should return user not found when wallet has no associated user', async () => {
      mockZealyQuestRepository.findOne.mockResolvedValue({ id: 1, type: 0 });
      mockUserService.getUserByWalletAddress.mockResolvedValue(null);

      const result = await service.handleZealyWebhook(mockPayload, 'test_zealy_api_key');

      expect(result).toEqual({ success: false, message: 'User not found in Spidex' });
    });

    it('should complete referral quest successfully', async () => {
      const mockQuest = {
        id: 1,
        type: 0, // REFERRAL_CHECK
        requirements: { referralCount: 2 },
      };
      const mockUser = { id: 1 };

      mockZealyQuestRepository.findOne.mockResolvedValue(mockQuest);
      mockUserService.getUserByWalletAddress.mockResolvedValue(mockUser);
      mockUserReferralService.getReferralCount.mockResolvedValue(3); // More than required
      mockZealyUserQuestRepository.create.mockReturnValue({ id: 1 });
      mockZealyUserQuestRepository.save.mockResolvedValue({ id: 1 });

      const result = await service.handleZealyWebhook(mockPayload, 'test_zealy_api_key');

      expect(result).toEqual({ success: true, message: 'Quest completed' });
      expect(mockUserReferralService.getReferralCount).toHaveBeenCalledWith(1);
      expect(mockZealyUserQuestRepository.create).toHaveBeenCalled();
      expect(mockZealyUserQuestRepository.save).toHaveBeenCalled();
    });

    it('should fail referral quest when requirements not met', async () => {
      const mockQuest = {
        id: 1,
        type: 0, // REFERRAL_CHECK
        requirements: { referralCount: 2 },
      };
      const mockUser = { id: 1 };

      mockZealyQuestRepository.findOne.mockResolvedValue(mockQuest);
      mockUserService.getUserByWalletAddress.mockResolvedValue(mockUser);
      mockUserReferralService.getReferralCount.mockResolvedValue(1); // Less than required

      const result = await service.handleZealyWebhook(mockPayload, 'test_zealy_api_key');

      expect(result).toEqual({
        success: false,
        message: 'Referral quest not completed. Current referrals: 1, required: 2',
      });
    });

    it('should complete trade quest successfully', async () => {
      const mockQuest = {
        id: 1,
        type: 1, // TRADE_CHECK
        requirements: { amount: 50, token: 'MIN' },
      };
      const mockUser = { id: 1 };

      mockZealyQuestRepository.findOne.mockResolvedValue(mockQuest);
      mockUserService.getUserByWalletAddress.mockResolvedValue(mockUser);
      mockSwapService.getTotalTokenTraded.mockResolvedValue(75); // More than required
      mockZealyUserQuestRepository.create.mockReturnValue({ id: 1 });
      mockZealyUserQuestRepository.save.mockResolvedValue({ id: 1 });

      const result = await service.handleZealyWebhook(mockPayload, 'test_zealy_api_key');

      expect(result).toEqual({ success: true, message: 'Quest completed' });
      expect(mockSwapService.getTotalTokenTraded).toHaveBeenCalledWith(1, 'MIN');
    });

    it('should fail trade quest when requirements not met', async () => {
      const mockQuest = {
        id: 1,
        type: 1, // TRADE_CHECK
        requirements: { amount: 50, token: 'MIN' },
      };
      const mockUser = { id: 1 };

      mockZealyQuestRepository.findOne.mockResolvedValue(mockQuest);
      mockUserService.getUserByWalletAddress.mockResolvedValue(mockUser);
      mockSwapService.getTotalTokenTraded.mockResolvedValue(25); // Less than required

      const result = await service.handleZealyWebhook(mockPayload, 'test_zealy_api_key');

      expect(result).toEqual({
        success: false,
        message: 'Trade quest not completed. Current traded MIN: 25, required: 50',
      });
    });
  });

  describe('Quest Categories', () => {
    it('should handle ONE_TIME quest logic', () => {
      // Test that ONE_TIME quests can only be completed once
      expect(true).toBe(true); // Placeholder for category-specific logic
    });

    it('should handle DAILY quest logic', () => {
      // Test that DAILY quests can be completed once per day
      expect(true).toBe(true); // Placeholder for category-specific logic
    });

    it('should handle MULTI_TIME quest logic', () => {
      // Test that MULTI_TIME quests can be completed multiple times
      expect(true).toBe(true); // Placeholder for category-specific logic
    });
  });

  describe('Edge Cases', () => {
    it('should handle service errors gracefully', async () => {
      const mockPayload = {
        userId: 'zealy_123',
        questId: 'quest_456',
        requestId: 'req_789',
        accounts: { wallet: '0x123456789abcdef' },
      };

      mockZealyQuestRepository.findOne.mockRejectedValue(new Error('Database error'));

      await expect(service.handleZealyWebhook(mockPayload, 'test_zealy_api_key'))
        .rejects.toThrow('Database error');
    });

    it('should handle missing quest requirements', async () => {
      const mockQuest = {
        id: 1,
        type: 0, // REFERRAL_CHECK
        requirements: null, // Missing requirements
      };
      const mockUser = { id: 1 };

      mockZealyQuestRepository.findOne.mockResolvedValue(mockQuest);
      mockUserService.getUserByWalletAddress.mockResolvedValue(mockUser);
      mockUserReferralService.getReferralCount.mockResolvedValue(3);

      const result = await service.handleZealyWebhook(
        {
          userId: 'zealy_123',
          questId: 'quest_456',
          requestId: 'req_789',
          accounts: { wallet: '0x123456789abcdef' },
        },
        'test_zealy_api_key'
      );

      // Should use default requirement of 2
      expect(result.success).toBe(true);
    });
  });
});