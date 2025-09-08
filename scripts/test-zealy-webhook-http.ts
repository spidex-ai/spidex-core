import axios from 'axios';

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';
const API_KEY = process.env.ZEALY_API_KEY || 'test_zealy_api_key';

interface ZealyWebhookPayload {
  userId: string;
  questId: string;
  requestId: string;
  accounts?: {
    wallet?: string;
  };
}

async function testZealyWebhookHTTP() {
  console.log('=== Testing Zealy Webhook HTTP Endpoint ===');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`API Key: ${API_KEY}`);
  console.log();

  const testCases = [
    {
      name: 'Test Referral Quest (should succeed)',
      payload: {
        userId: 'zealy_user_123',
        questId: 'zealy_referral_friends_2',
        requestId: 'req_123',
        communityId: 'zealy_community_1',
        accounts: {
          wallet:
            'addr1q9gykktajrgrmj5am8vwlhp65a72emlwn2s3e5cadkhe3vrfkfxs6yajls3ft0yn42uqlcnrq6qcn3l0lunkxy6aplgspxm6da',
        },
      },
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
      expectedStatus: 200,
    },
    {
      name: 'Test Trading Quest (should succeed)',
      payload: {
        userId: 'zealy_user_456',
        questId: 'zealy_trade_sundae_50',
        communityId: 'zealy_community_1',
        requestId: 'req_456',
        accounts: {
          wallet:
            'addr1q9gykktajrgrmj5am8vwlhp65a72emlwn2s3e5cadkhe3vrfkfxs6yajls3ft0yn42uqlcnrq6qcn3l0lunkxy6aplgspxm6da',
        },
      },
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
      expectedStatus: 200,
    },
    {
      name: 'Test Invalid API Key (should fail)',
      payload: {
        userId: 'zealy_user_789',
        questId: 'zealy_referral_friends_2',
        communityId: 'zealy_community_1',
        requestId: 'req_789',
        accounts: {
          wallet:
            'addr1q9gykktajrgrmj5am8vwlhp65a72emlwn2s3e5cadkhe3vrfkfxs6yajls3ft0yn42uqlcnrq6qcn3l0lunkxy6aplgspxm6da',
        },
      },
      headers: {
        'x-api-key': 'wrong_api_key',
        'Content-Type': 'application/json',
      },
      expectedStatus: 400,
    },
    {
      name: 'Test Missing API Key (should fail)',
      payload: {
        userId: 'zealy_user_999',
        questId: 'zealy_referral_friends_2',
        communityId: 'zealy_community_1',
        requestId: 'req_999',
        accounts: {
          wallet:
            'addr1q9gykktajrgrmj5am8vwlhp65a72emlwn2s3e5cadkhe3vrfkfxs6yajls3ft0yn42uqlcnrq6qcn3l0lunkxy6aplgspxm6da',
        },
      },
      headers: {
        'Content-Type': 'application/json',
        // No API key header
      },
      expectedStatus: 400,
    },
    {
      name: 'Test Non-existent Quest (should fail)',
      payload: {
        userId: 'zealy_user_888',
        questId: 'non_existent_quest',
        communityId: 'zealy_community_1',
        requestId: 'req_888',
        accounts: {
          wallet:
            'addr1q9gykktajrgrmj5am8vwlhp65a72emlwn2s3e5cadkhe3vrfkfxs6yajls3ft0yn42uqlcnrq6qcn3l0lunkxy6aplgspxm6da',
        },
      },
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
      expectedStatus: 400, // Will return 200 but success: false
    },
  ];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`${i + 1}. ${testCase.name}`);

    try {
      const response = await axios.post(`${BASE_URL}/api/user-quest/zealy/webhook`, testCase.payload, {
        headers: testCase.headers,
        validateStatus: () => true, // Don't throw on non-2xx status codes
      });

      console.log(`   Status: ${response.status} ${response.statusText}`);
      console.log(`   Response:`, JSON.stringify(response.data, null, 2));

      if (response.status === testCase.expectedStatus) {
        console.log('   ✅ Status code matches expectation');
      } else {
        console.log(`   ⚠️  Expected status: ${testCase.expectedStatus}, got: ${response.status}`);
      }

      // Additional validation for successful responses
      if (response.status === 200 && response.data) {
        if (response.data.success !== undefined) {
          console.log(`   Quest verification: ${response.data.success ? '✅ SUCCESS' : '❌ FAILED'}`);
          if (response.data.message) {
            console.log(`   Message: ${response.data.message}`);
          }
        }
      }
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Response:`, JSON.stringify(error.response.data, null, 2));
      }
    }

    console.log('   ' + '-'.repeat(60));
  }

  console.log('\n=== HTTP Test Complete ===');
  console.log('\nNote: For successful tests, check the application logs and database');
  console.log('to verify that quest completions were properly recorded.');
}

// Run the test
if (require.main === module) {
  testZealyWebhookHTTP().catch(console.error);
}

export { testZealyWebhookHTTP };
