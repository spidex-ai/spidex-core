import { AppDataSource } from '../src/ormconfig';
import { UserQuestService } from '../src/modules/user-quest/services/user-quest.service';
import { ZealyWebhookPayload } from '../src/modules/user-quest/interfaces/zealy-webhook.interface';
import { UserService } from '../src/modules/user/user.service';
import { UserReferralService } from '../src/modules/user-referral/user-referral.service';
import { SwapService } from '../src/modules/swap/swap.service';
import { ConfigService } from '@nestjs/config';
import { UserQuestRepository } from '../src/database/repositories/user-quest.repository';
import { ZealyQuestRepository } from '../src/database/repositories/zealy-quest.repository';
import { ZealyUserQuestRepository } from '../src/database/repositories/zealy-user-quest.repository';
import { UserPointService } from '../src/modules/user-point/services/user-point.service';
import { RabbitMQService } from '../src/shared/modules/rabbitmq/rabbitmq.service';
import { QuestService } from '../src/modules/user-quest/services/quest.service';
import { LoggerService } from '../src/shared/modules/loggers/logger.service';

async function testZealyWebhook() {
  try {
    await AppDataSource.initialize();
    
    console.log('=== Testing Zealy Webhook Handler ===\n');
    
    // Mock services (for testing purposes)
    const mockConfigService = {
      get: (key: string) => {
        if (key === 'ZEALY_API_KEY') return 'test_zealy_api_key';
        return null;
      }
    } as ConfigService;
    
    const mockLogger = {
      log: (...args: any[]) => console.log('[LOG]', ...args),
      warn: (...args: any[]) => console.log('[WARN]', ...args),
      error: (...args: any[]) => console.log('[ERROR]', ...args),
    };
    
    const mockLoggerService = {
      getLogger: () => mockLogger
    } as any;
    
    const mockUserService = {
      getUserByWalletAddress: async (walletAddress: string) => {
        // Mock user for testing
        if (walletAddress === 'addr_test1234...') {
          return { id: 1, walletAddress };
        }
        return null;
      }
    } as UserService;
    
    const mockUserReferralService = {
      getReferralCount: async (userId: number) => {
        // Mock referral count - simulate user has 3 referrals
        console.log(`[MOCK] Getting referral count for user ${userId}`);
        return 3; // More than required 2
      }
    } as UserReferralService;
    
    const mockSwapService = {
      getTotalTokenTraded: async (userId: number, token: string) => {
        // Mock trading volume - simulate user has traded 75 SUNDAE tokens
        console.log(`[MOCK] Getting total traded for user ${userId}, token ${token}`);
        if (token === 'c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad0014df105553444d') {
          return 75; // More than required 50
        }
        return 0;
      }
    } as SwapService;
    
    const mockServices = {
      userPointService: {} as UserPointService,
      rabbitMQService: {} as RabbitMQService,
      questService: {} as QuestService,
    };
    
    // Get real repositories
    const userQuestRepository = AppDataSource.getRepository(UserQuestRepository);
    const zealyQuestRepository = AppDataSource.getRepository(ZealyQuestRepository);
    const zealyUserQuestRepository = AppDataSource.getRepository(ZealyUserQuestRepository);
    
    // Create service instance
    const userQuestService = new UserQuestService(
      userQuestRepository,
      zealyQuestRepository,
      zealyUserQuestRepository,
      mockServices.userPointService,
      mockServices.rabbitMQService,
      mockServices.questService,
      mockLoggerService,
      mockUserReferralService,
      mockSwapService,
      mockConfigService,
      mockUserService,
    );
    
    // Test cases
    const testCases = [
      {
        name: 'Test Referral Quest (should succeed)',
        payload: {
          userId: 'zealy_user_123',
          questId: 'zealy_referral_friends_2',
          requestId: 'req_123',
          accounts: {
            wallet: 'addr_test1234...'
          }
        } as ZealyWebhookPayload,
        apiKey: 'test_zealy_api_key',
        expectedSuccess: true
      },
      {
        name: 'Test Trading Quest (should succeed)',
        payload: {
          userId: 'zealy_user_456',
          questId: 'zealy_trade_sundae_50',
          requestId: 'req_456',
          accounts: {
            wallet: 'addr_test1234...'
          }
        } as ZealyWebhookPayload,
        apiKey: 'test_zealy_api_key',
        expectedSuccess: true
      },
      {
        name: 'Test Invalid API Key (should fail)',
        payload: {
          userId: 'zealy_user_789',
          questId: 'zealy_referral_friends_2',
          requestId: 'req_789',
          accounts: {
            wallet: 'addr_test1234...'
          }
        } as ZealyWebhookPayload,
        apiKey: 'wrong_api_key',
        expectedSuccess: false
      },
      {
        name: 'Test Non-existent Quest (should fail)',
        payload: {
          userId: 'zealy_user_999',
          questId: 'non_existent_quest',
          requestId: 'req_999',
          accounts: {
            wallet: 'addr_test1234...'
          }
        } as ZealyWebhookPayload,
        apiKey: 'test_zealy_api_key',
        expectedSuccess: false
      },
      {
        name: 'Test User Not Found (should fail)',
        payload: {
          userId: 'zealy_user_888',
          questId: 'zealy_referral_friends_2',
          requestId: 'req_888',
          accounts: {
            wallet: 'unknown_wallet_address'
          }
        } as ZealyWebhookPayload,
        apiKey: 'test_zealy_api_key',
        expectedSuccess: false
      }
    ];
    
    // Run test cases
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`\n${i + 1}. ${testCase.name}`);
      console.log('   Payload:', JSON.stringify(testCase.payload, null, 2));
      
      try {
        const result = await userQuestService.handleZealyWebhook(testCase.payload, testCase.apiKey);
        console.log('   ✅ Result:', JSON.stringify(result, null, 2));
        
        if (result.success !== testCase.expectedSuccess) {
          console.log(`   ⚠️  Expected success: ${testCase.expectedSuccess}, got: ${result.success}`);
        } else {
          console.log(`   ✅ Result matches expectation`);
        }
        
      } catch (error) {
        console.log('   ❌ Error:', error.message);
        if (testCase.expectedSuccess) {
          console.log('   ⚠️  Expected success but got error');
        } else {
          console.log('   ✅ Error as expected');
        }
      }
      
      console.log('   ' + '-'.repeat(50));
    }
    
    // Check database state
    console.log('\n=== Database State After Tests ===');
    
    const zealyUserQuests = await zealyUserQuestRepository.find({});
    console.log('\nZealy User Quest Completions:');
    if (zealyUserQuests.length === 0) {
      console.log('No completions found');
    } else {
      zealyUserQuests.forEach((completion: any, index: number) => {
        console.log(`${index + 1}. User ID: ${completion.userId}, Quest ID: ${completion.zealyQuestId}`);
        console.log(`   Status: ${completion.status === 0 ? 'COMPLETED' : 'FAILED'}`);
        console.log(`   Zealy User: ${completion.zealyUserId}`);
        console.log(`   Request ID: ${completion.zealyRequestId}`);
        console.log(`   Verified At: ${completion.verifiedAt}`);
      });
    }
    
    await AppDataSource.destroy();
    console.log('\n=== Test Complete ===');
    
  } catch (error) {
    console.error('Error running Zealy webhook test:', error);
    process.exit(1);
  }
}

testZealyWebhook();