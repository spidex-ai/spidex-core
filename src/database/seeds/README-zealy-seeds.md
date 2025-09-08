# Zealy Quest Seeder

This seeder creates sample Zealy quests for testing and initial setup of the external quest verification system.

## Seeded Quests

### 1. Referral Quest
- **Zealy ID**: `zealy_referral_friends_2`
- **Name**: "Refer 2 Friends to Spidex"
- **Category**: `ONE_TIME` (0)
- **Type**: `REFERRAL_CHECK` (0)
- **Requirements**: Must refer 2 friends
- **Status**: `ACTIVE` (1)

### 2. Trading Quest (SUNDAE Token)
- **Zealy ID**: `zealy_trade_sundae_50`
- **Name**: "Trade 50 SUNDAE Tokens"
- **Category**: `ONE_TIME` (0)
- **Type**: `TRADE_CHECK` (1)
- **Requirements**: Must trade 50 SUNDAE tokens
- **Token**: `c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad0014df105553444d`
- **Status**: `ACTIVE` (1)

## Usage

### Run All Seeds (includes Zealy quests)
```bash
yarn db:seed
```

### Run Only Zealy Quest Seeder
```bash
yarn db:seed:zealy
```

### Prerequisites
1. Database migrations must be applied first:
   ```bash
   yarn db:migration:run
   ```

2. Database connection must be configured in `.env`

## Quest Categories

- `ONE_TIME` (0): Can only be completed once per user
- `DAILY` (1): Can be completed once per day
- `MULTI_TIME` (2): Can be completed multiple times up to a limit

## Quest Types

- `REFERRAL_CHECK` (0): Verifies user referral count
- `TRADE_CHECK` (1): Verifies user trading volume for specific tokens

## Quest Status

- `INACTIVE` (0): Quest is not active
- `ACTIVE` (1): Quest is active and can be completed

## Webhook Integration

These seeded quests work with the Zealy webhook endpoint:

```
POST /user-quest/zealy/webhook
```

The webhook will:
1. Look up quests by `zealyQuestId`
2. Verify completion based on `type` and `requirements`
3. Apply `category` rules for completion limits
4. Create completion records in `zealy_user_quests` table

## Customizing Seeds

To modify the seeded quests, edit:
- **Data**: `src/database/data-seed/zealy-quest.seed.json`
- **Logic**: `src/database/seeds/zealy-quest.seed.ts`

Then run the seeder again to apply changes.