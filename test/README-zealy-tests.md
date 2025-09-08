# Zealy Quest Testing Suite

This directory contains comprehensive tests for the Zealy external quest verification system in spidex-core.

## Test Structure

### 1. Unit Tests
**File**: `src/modules/user-quest/services/user-quest.service.spec.ts`

Tests the core business logic of Zealy quest verification:
- Quest verification methods (referral and trade checks)
- Category-based completion rules (ONE_TIME, DAILY, MULTI_TIME)
- Error handling and edge cases
- Webhook payload processing

### 2. E2E Tests
**File**: `test/zealy-webhook.e2e-spec.ts`

Tests the complete webhook endpoint integration:
- HTTP webhook endpoint testing
- Database integration
- Real-world scenarios
- Authentication and authorization
- Duration-based quest constraints

### 3. Test Fixtures
**File**: `test/fixtures/zealy-quest.fixtures.ts`

Provides reusable test data and scenarios:
- Pre-configured quest entities
- Mock webhook payloads
- Test scenarios for common use cases
- Constants for consistent testing

### 4. Test Helpers
**File**: `test/helpers/zealy-test.helper.ts`

Utility functions for test setup and teardown:
- Database cleanup
- Test data creation
- Quest attempt verification
- Time mocking utilities

## Running the Tests

### Using the Test Runner Script
```bash
# Make the script executable (one time setup)
chmod +x test/run-zealy-tests.sh

# Run all tests
./test/run-zealy-tests.sh

# Run specific test suites
./test/run-zealy-tests.sh unit      # Unit tests only
./test/run-zealy-tests.sh e2e       # E2E tests only
./test/run-zealy-tests.sh coverage  # Tests with coverage report

# Validate test setup
./test/run-zealy-tests.sh validate
```

### Using NPM Scripts Directly
```bash
# Unit tests
npm run test -- user-quest.service.spec.ts

# E2E tests
npm run test:e2e -- zealy-webhook.e2e-spec.ts

# Coverage report
npm run test:cov -- --testPathPattern="zealy"

# Watch mode for development
npm run test:watch -- user-quest.service.spec.ts
```

## Test Scenarios Covered

### 1. Referral Quest Verification
- ✅ Successful completion with sufficient referrals
- ✅ Failure when referral count is insufficient
- ✅ Error handling for service failures
- ✅ One-time completion rules
- ✅ Daily completion rules
- ✅ Multi-time completion rules

### 2. Trade Quest Verification
- ✅ Successful completion with sufficient trading volume
- ✅ Failure when trade volume is insufficient
- ✅ Token-specific verification (MIN tokens)
- ✅ Error handling for service failures

### 3. Category-Based Completion Rules
- ✅ ONE_TIME: Prevent duplicate completions
- ✅ DAILY: Allow once per day, prevent same-day duplicates
- ✅ MULTI_TIME: Allow unlimited completions

### 4. Duration-Based Constraints
- ✅ Reject quests before start date
- ✅ Reject quests after end date
- ✅ Accept quests within valid duration

### 5. Authentication & Authorization
- ✅ Valid API key acceptance
- ✅ Invalid API key rejection
- ✅ Missing API key handling

### 6. Edge Cases & Error Handling
- ✅ Non-existent quest handling
- ✅ Non-existent user handling
- ✅ Database connection failures
- ✅ Service timeout scenarios
- ✅ Malformed webhook payloads

## Database Requirements for Testing

The tests require the following database entities to be set up:
- `zealy_quests` - Zealy quest definitions
- `zealy_user_quests` - User quest attempt records
- `users` - User accounts with wallet addresses
- `user_referrals` - Referral relationships
- `swap_transactions` - Trading history

## Environment Variables for Testing

```bash
# Required for E2E tests
NODE_ENV=test
ZEALY_API_KEY=test_zealy_api_key

# Database configuration
DATABASE_URL=postgresql://user:password@localhost:5432/spidex_test
```

## Mock Services

The unit tests mock the following services:
- `UserReferralService` - For referral count verification
- `SwapService` - For trading volume verification
- `UserService` - For wallet-to-user mapping
- `ConfigService` - For configuration values
- `LoggerService` - For logging

## Test Data Setup

### Sample Zealy Quest Records
```sql
-- Referral quest (one-time)
INSERT INTO zealy_quests (zealy_quest_id, name, category, type, requirements, status) 
VALUES ('zealy_ref_001', 'Refer 2 Friends', 0, 0, '{"referralCount": 2}', 1);

-- Trade quest (one-time)  
INSERT INTO zealy_quests (zealy_quest_id, name, category, type, requirements, status)
VALUES ('zealy_trade_002', 'Trade 50 MIN', 0, 1, '{"amount": 50, "token": "MIN"}', 1);

-- Daily referral quest
INSERT INTO zealy_quests (zealy_quest_id, name, category, type, requirements, status)
VALUES ('zealy_daily_003', 'Daily Referral', 1, 0, '{"referralCount": 1}', 1);
```

## Debugging Tests

### Enable Verbose Logging
```bash
DEBUG=* npm run test -- user-quest.service.spec.ts --verbose
```

### Database Debugging
```bash
# Check test database state
psql spidex_test -c "SELECT * FROM zealy_quests;"
psql spidex_test -c "SELECT * FROM zealy_user_quests;"
```

### Common Issues

1. **Import Path Errors**: Ensure TypeScript path aliases are configured correctly
2. **Database Connection**: Verify test database is running and accessible
3. **Environment Variables**: Check all required env vars are set
4. **Async Operations**: Ensure all async operations are properly awaited

## Contributing

When adding new Zealy quest types or features:

1. Add unit tests for the new functionality
2. Add E2E tests for the complete workflow
3. Create fixtures for the new quest types
4. Update this documentation
5. Ensure all tests pass before submitting PR

## Coverage Goals

- **Unit Tests**: >90% coverage for quest verification logic
- **E2E Tests**: Cover all critical user journeys
- **Integration Tests**: Verify database interactions
- **Error Cases**: Test all error scenarios and edge cases