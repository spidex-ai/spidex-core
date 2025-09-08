#!/bin/bash

# Zealy Webhook Test Script
# Tests the handleZealyWebhook function with the seeded quests

BASE_URL="${API_BASE_URL:-http://localhost:8000}"
API_KEY="${ZEALY_API_KEY:-test_zealy_api_key}"

echo "=== Testing Zealy Webhook Endpoint ==="
echo "Base URL: $BASE_URL"
echo "API Key: $API_KEY"
echo ""

# Test 1: Referral Quest (should succeed if user has ≥2 referrals)
echo "1. Testing Referral Quest - zealy_referral_friends_2"
curl -X POST "$BASE_URL/api/user-quest/zealy/webhook" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "userId": "zealy_user_123", 
    "questId": "zealy_referral_friends_2",
    "requestId": "req_ref_123",
    "accounts": {
      "wallet": "addr1q9gykktajrgrmj5am8vwlhp65a72emlwn2s3e5cadkhe3vrfkfxs6yajls3ft0yn42uqlcnrq6qcn3l0lunkxy6aplgspxm6da"
    }
  }' \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || cat
echo ""
echo "----------------------------------------"

# Test 2: Trading Quest (should succeed if user has traded ≥50 SUNDAE tokens)  
echo "2. Testing Trading Quest - zealy_trade_sundae_50"
curl -X POST "$BASE_URL/api/user-quest/zealy/webhook" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "userId": "zealy_user_456",
    "questId": "zealy_trade_sundae_50", 
    "requestId": "req_trade_456",
    "accounts": {
      "wallet": "addr1q9gykktajrgrmj5am8vwlhp65a72emlwn2s3e5cadkhe3vrfkfxs6yajls3ft0yn42uqlcnrq6qcn3l0lunkxy6aplgspxm6da"
    }
  }' \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || cat
echo ""
echo "----------------------------------------"

# Test 3: Invalid API Key (should fail with 401)
echo "3. Testing Invalid API Key"
curl -X POST "$BASE_URL/api/user-quest/zealy/webhook" \
  -H "Content-Type: application/json" \
  -H "x-api-key: wrong_api_key" \
  -d '{
    "userId": "zealy_user_789",
    "questId": "zealy_referral_friends_2", 
    "requestId": "req_invalid_789",
    "accounts": {
      "wallet": "addr1q9gykktajrgrmj5am8vwlhp65a72emlwn2s3e5cadkhe3vrfkfxs6yajls3ft0yn42uqlcnrq6qcn3l0lunkxy6aplgspxm6da"
    }
  }' \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || cat
echo ""
echo "----------------------------------------"

# Test 4: Non-existent Quest (should fail)
echo "4. Testing Non-existent Quest"
curl -X POST "$BASE_URL/api/user-quest/zealy/webhook" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "userId": "zealy_user_999",
    "questId": "non_existent_quest",
    "requestId": "req_not_found_999", 
    "accounts": {
      "wallet": "addr1q9gykktajrgrmj5am8vwlhp65a72emlwn2s3e5cadkhe3vrfkfxs6yajls3ft0yn42uqlcnrq6qcn3l0lunkxy6aplgspxm6da"
    }
  }' \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || cat
echo ""
echo "----------------------------------------"

# Test 5: Missing API Key (should fail with 401)
echo "5. Testing Missing API Key"
curl -X POST "$BASE_URL/api/user-quest/zealy/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "zealy_user_888",
    "questId": "zealy_referral_friends_2",
    "requestId": "req_no_key_888",
    "accounts": {
      "wallet": "addr1q9gykktajrgrmj5am8vwlhp65a72emlwn2s3e5cadkhe3vrfkfxs6yajls3ft0yn42uqlcnrq6qcn3l0lunkxy6aplgspxm6da"
    }
  }' \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || cat
echo ""
echo "----------------------------------------"

# Test 6: User not found (should fail - user doesn't exist in spidex)
echo "6. Testing User Not Found in Spidex"
curl -X POST "$BASE_URL/api/user-quest/zealy/webhook" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "userId": "zealy_user_unknown",
    "questId": "zealy_referral_friends_2",
    "requestId": "req_unknown_user", 
    "accounts": {
      "wallet": "addr_unknown_wallet_address"
    }
  }' \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || cat
echo ""
echo "----------------------------------------"

echo ""
echo "=== Test Summary ==="
echo "Quest IDs used:"
echo "- zealy_referral_friends_2 (requires 2 referrals)"
echo "- zealy_trade_sundae_50 (requires 50 SUNDAE token trades)"
echo ""
echo "Expected Results:"
echo "✅ Tests 1-2: Should succeed IF user exists and meets requirements"
echo "❌ Test 3: Should fail with 401 (Invalid API Key)"
echo "❌ Test 4: Should fail with 'Quest not found'"  
echo "❌ Test 5: Should fail with 401 (Missing API Key)"
echo "❌ Test 6: Should fail with 'User not found in Spidex'"
echo ""
echo "Note: Success of tests 1-2 depends on:"
echo "1. User with wallet 'addr1q9gykktajrgrmj5am8vwlhp65a72emlwn2s3e5cadkhe3vrfkfxs6yajls3ft0yn42uqlcnrq6qcn3l0lunkxy6aplgspxm6da' exists in database"
echo "2. User has ≥2 referrals (test 1) or ≥50 SUNDAE trades (test 2)"