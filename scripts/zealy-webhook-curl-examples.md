# Zealy Webhook CURL Test Examples

These CURL commands test the `handleZealyWebhook` function with the seeded Zealy quests.

## Environment Setup
```bash
export API_BASE_URL="http://localhost:8000"
export ZEALY_API_KEY="your_zealy_api_key_here"
```

## Test Cases

### 1. Test Referral Quest (Success Case)
Tests the referral quest that requires 2 friend referrals:

```bash
curl -X POST "$API_BASE_URL/api/user-quest/zealy/webhook" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $ZEALY_API_KEY" \
  -d '{
    "userId": "zealy_user_123",
    "questId": "zealy_referral_friends_2", 
    "requestId": "req_ref_123",
    "accounts": {
      "wallet": "addr1q9gykktajrgrmj5am8vwlhp65a72emlwn2s3e5cadkhe3vrfkfxs6yajls3ft0yn42uqlcnrq6qcn3l0lunkxy6aplgspxm6da"
    }
  }' | jq '.'
```

### 2. Test Trading Quest (Success Case)
Tests the trading quest that requires 50 SUNDAE token trades:

```bash
curl -X POST "$API_BASE_URL/api/user-quest/zealy/webhook" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $ZEALY_API_KEY" \
  -d '{
    "userId": "zealy_user_456",
    "questId": "zealy_trade_sundae_50",
    "requestId": "req_trade_456", 
    "accounts": {
      "wallet": "addr1q9gykktajrgrmj5am8vwlhp65a72emlwn2s3e5cadkhe3vrfkfxs6yajls3ft0yn42uqlcnrq6qcn3l0lunkxy6aplgspxm6da"
    }
  }' | jq '.'
```

### 3. Test Invalid API Key (Error Case)
Should return 401 Unauthorized:

```bash
curl -X POST "$API_BASE_URL/api/user-quest/zealy/webhook" \
  -H "Content-Type: application/json" \
  -H "x-api-key: wrong_api_key" \
  -d '{
    "userId": "zealy_user_789",
    "questId": "zealy_referral_friends_2",
    "requestId": "req_invalid_789",
    "accounts": {
      "wallet": "addr1q9gykktajrgrmj5am8vwlhp65a72emlwn2s3e5cadkhe3vrfkfxs6yajls3ft0yn42uqlcnrq6qcn3l0lunkxy6aplgspxm6da"
    }
  }' | jq '.'
```

### 4. Test Non-existent Quest (Error Case)  
Should return success: false with "Quest not found":

```bash
curl -X POST "$API_BASE_URL/api/user-quest/zealy/webhook" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $ZEALY_API_KEY" \
  -d '{
    "userId": "zealy_user_999", 
    "questId": "non_existent_quest",
    "requestId": "req_not_found_999",
    "accounts": {
      "wallet": "addr1q9gykktajrgrmj5am8vwlhp65a72emlwn2s3e5cadkhe3vrfkfxs6yajls3ft0yn42uqlcnrq6qcn3l0lunkxy6aplgspxm6da"
    }
  }' | jq '.'
```

### 5. Test Missing API Key (Error Case)
Should return 401 Unauthorized:

```bash
curl -X POST "$API_BASE_URL/api/user-quest/zealy/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "zealy_user_888",
    "questId": "zealy_referral_friends_2", 
    "requestId": "req_no_key_888",
    "accounts": {
      "wallet": "addr1q9gykktajrgrmj5am8vwlhp65a72emlwn2s3e5cadkhe3vrfkfxs6yajls3ft0yn42uqlcnrq6qcn3l0lunkxy6aplgspxm6da"
    }
  }' | jq '.'
```

### 6. Test User Not Found (Error Case)
Should return success: false with "User not found in Spidex":

```bash
curl -X POST "$API_BASE_URL/api/user-quest/zealy/webhook" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $ZEALY_API_KEY" \
  -d '{
    "userId": "zealy_user_unknown",
    "questId": "zealy_referral_friends_2",
    "requestId": "req_unknown_user",
    "accounts": {
      "wallet": "addr_unknown_wallet_address"
    }
  }' | jq '.'
```

## Seeded Quest Details

### Referral Quest
- **Quest ID**: `zealy_referral_friends_2`
- **Name**: "Refer 2 Friends to Spidex"
- **Type**: REFERRAL_CHECK
- **Requirements**: User must have referred at least 2 friends
- **Category**: ONE_TIME (can only be completed once)

### Trading Quest  
- **Quest ID**: `zealy_trade_sundae_50`
- **Name**: "Trade 50 SUNDAE Tokens"
- **Type**: TRADE_CHECK
- **Requirements**: User must have traded at least 50 of token `c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad0014df105553444d` (SUNDAE)
- **Category**: ONE_TIME (can only be completed once)

## Expected Responses

### Success Response
```json
{
  "success": true,
  "message": "Quest completed"
}
```

### Failure Response
```json
{
  "success": false,
  "message": "Error description here"
}
```

### Authentication Error (401)
```json
{
  "message": "Invalid API Key",
  "error": "Unauthorized",
  "statusCode": 401
}
```

## Quick Test Script
Run all tests at once:

```bash
./scripts/test-zealy-webhook.sh
```

## Notes
- Replace `$API_BASE_URL` with your server URL (default: http://localhost:8000)
- Replace `$ZEALY_API_KEY` with your actual Zealy API key
- Tests 1-2 will only succeed if:
  1. A user with the test wallet address exists in your database
  2. That user meets the quest requirements (2 referrals or 50 SUNDAE trades)
- The `jq '.'` command formats JSON output (install with `brew install jq` on macOS)