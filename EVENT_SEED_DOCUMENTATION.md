# Event System - Seed Data Documentation

## Overview
This document describes the event seed data created for testing and development purposes.

## 🚀 Running the Seeds

### Basic Event Seed
```bash
npm run db:seed
```
This runs all seeders including the new event seeder.

### Event-Specific Commands
```bash
# Run specific seeder (if needed)
npm run console:dev -- seed:run --class=EventSeeder

# Create test participants and trades
npm run console:dev -- seed:run --class=EventTestDataSeeder
```

## 📊 Seeded Events

### 1. DJED Trading Championship
- **Type**: Trading Competition
- **Status**: Active
- **Duration**: Jan 25 - Feb 15, 2025
- **Prize Pool**: $50,000
- **Tokens**: DJED (8db269c3ec630e06ae29f74bc39edd1f87c819f1056206e879a1cd61446a65644a45444)
- **Prizes**: 
  - 1st: 10,000 points + 5,000 DJED
  - 2nd: 7,500 points + 3,000 DJED
  - 3rd: 5,000 points + 2,000 DJED
  - 4th-10th: 2,500 points + 500 DJED each
  - 11th-50th: 1,000 points each

### 2. ADA Volume Challenge
- **Type**: Volume Challenge
- **Status**: Active
- **Duration**: Jan 20 - Feb 28, 2025
- **Prize Pool**: $75,000
- **Tokens**: ADA, Lovelace
- **Prizes**: 
  - 1st: 15,000 points + 10,000 ADA
  - 2nd: 10,000 points + 7,000 ADA
  - 3rd: 7,500 points + 5,000 ADA
  - 4th-10th: 3,000 points + 1,000 ADA each
  - 11th-25th: 1,500 points + 500 ADA each
  - 26th-100th: 500 points each

### 3. SNEK Token Mania
- **Type**: Token Specific
- **Status**: Active
- **Duration**: Feb 1 - Feb 14, 2025
- **Prize Pool**: $25,000
- **Tokens**: SNEK (279c909f348e533da5808898f87f9a14bb2c3dfbbacccd631d927a3f534e454b)
- **Prizes**:
  - 1st: 8,000 points + 1M SNEK
  - 2nd-3rd: 5,000 points + 500K SNEK each
  - 4th-10th: 2,000 points + 100K SNEK each
  - 11th-30th: 750 points each

### 4. MIN Token Traders Cup
- **Type**: Token Specific
- **Status**: Active
- **Duration**: Jan 28 - Feb 20, 2025
- **Prize Pool**: $40,000
- **Tokens**: MIN (29d222ce763455e3d7a09a665ce554f00ac89d2e99a1a83d267170c64d494e)
- **Prizes**:
  - 1st: 12,000 points + 10,000 MIN
  - 2nd: 8,000 points + 6,000 MIN
  - 3rd-5th: 4,000 points + 2,000 MIN each
  - 6th-20th: 1,500 points + 500 MIN each
  - 21st-50th: 600 points each

### 5. Multi-Token Championship
- **Type**: Trading Competition
- **Status**: Active
- **Duration**: Feb 5 - Mar 5, 2025
- **Prize Pool**: $100,000
- **Tokens**: DJED, SNEK, MIN, SUNDAE, TGBAT
- **Prizes**:
  - 1st: 25,000 points + 15,000 ADA
  - 2nd: 18,000 points + 10,000 ADA
  - 3rd: 12,000 points + 7,000 ADA
  - 4th-10th: 6,000 points + 2,000 MIN each
  - 11th-25th: 3,000 points + 1,000 DJED each
  - 26th-50th: 1,200 points each
  - 51st-100th: 500 points each

### 6. Weekend Warriors (Draft)
- **Type**: Trading Competition
- **Status**: Draft
- **Duration**: Feb 14 - Feb 16, 2025 (Weekend)
- **Prize Pool**: $15,000
- **Tokens**: DJED, SNEK
- **Prizes**:
  - 1st: 5,000 points + 500K SNEK
  - 2nd-3rd: 3,000 points + 1,500 DJED each
  - 4th-10th: 1,500 points each
  - 11th-25th: 600 points each

### 7. Spring Trading Festival (Draft)
- **Type**: Trading Competition
- **Status**: Draft
- **Duration**: Mar 1 - Mar 31, 2025 (Full Month)
- **Prize Pool**: $200,000
- **Tokens**: ADA, DJED, SNEK, MIN, SUNDAE
- **Prizes**:
  - 1st: 50,000 points + 25,000 ADA
  - 2nd: 30,000 points + 15,000 ADA
  - 3rd: 20,000 points + 10,000 ADA
  - 4th-10th: 8,000 points + 3,000 MIN each
  - 11th-25th: 4,000 points + 2,000 DJED each
  - 26th-50th: 2,000 points + 200K SNEK each
  - 51st-100th: 1,000 points each
  - 101st-500th: 250 points each

## 🔄 Test Data Generator

The `EventTestDataSeeder` creates realistic test data:

- **Test Participants**: Creates 5 participants per active event (15 total)
- **Test Trades**: Creates 1-3 trades per participant (~45 trades)
- **Realistic Volumes**: Random volumes between $1,000-$51,000
- **Trade Types**: Random BUY/SELL operations
- **Timestamps**: Realistic join times and trade timestamps

## 🎯 Token Addresses Used

### Cardano Native Tokens:
- **ADA**: `ada` or `lovelace`
- **DJED**: `8db269c3ec630e06ae29f74bc39edd1f87c819f1056206e879a1cd61446a65644a45444`
- **SNEK**: `279c909f348e533da5808898f87f9a14bb2c3dfbbacccd631d927a3f534e454b`
- **MIN**: `29d222ce763455e3d7a09a665ce554f00ac89d2e99a1a83d267170c64d494e`
- **SUNDAE**: `25f0fc240e91bd95dcdaebd2ba7713fc5168ac77234a3d79449fc20c534f494e44594e`
- **TGBAT**: `682fe60c9918842b3323c43b5144bc3d52a23bd2fb81345560d73f5746424154`

## 🧪 Testing Scenarios

### 1. Active Event Testing
- Events 1-5 are active and ready for testing
- Users can trade the specified tokens to automatically join
- Leaderboards will update based on trading activity

### 2. Draft Event Testing
- Events 6-7 are in draft status
- Can be activated via admin interface
- Test event lifecycle management

### 3. Prize System Testing
- Each event has comprehensive prize structures
- Test rank-based prize distribution
- Validate point and token rewards

### 4. Multi-Token Events
- Event 5 supports multiple tokens
- Test complex trading scenarios
- Validate token-specific trade recording

## 🔧 Development Commands

```bash
# View seeded events
npm run console:dev -- event:list

# Check event participants
npm run console:dev -- event:participants --eventId=1

# Update rankings
npm run console:dev -- event:update-ranks --eventId=1

# Generate test trades
npm run console:dev -- event:generate-test-trades --count=100
```

## 📈 Expected Outcomes

After running the seeds:
1. **7 Events** with diverse configurations
2. **39 Prize Tiers** across all events
3. **$505,000** total prize pool
4. **5 Active Events** ready for testing
5. **2 Draft Events** for lifecycle testing

## 🚨 Important Notes

- **Test Data**: This is development seed data, not production data
- **Token Addresses**: Use real Cardano token addresses for accurate testing
- **Rank Updates**: Run rank update commands after creating test trades
- **Cache Invalidation**: Clear leaderboard cache after bulk data changes
- **Database State**: Seeds check for existing data to avoid duplicates

## 🔄 Cleanup

To reset event data:
```bash
# Clear all event data (destructive!)
npm run console:dev -- event:clear-all --confirm

# Or manually truncate tables:
# TRUNCATE event_trades, event_participants, event_rank_prizes, events CASCADE;
```