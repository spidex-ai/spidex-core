# Event Seeder Documentation

## Overview

The Event Seeder has been enhanced with TypeScript types, validation, and improved maintainability to seed event and event rank prize data into the database.

## 🔧 Architecture

### Type Safety
- **EventSeedData**: Interface for event seed data structure
- **EventRankPrizeSeedData**: Interface for event rank prize seed data structure
- **EventPrizeMap**: Type for mapping event IDs to their prize configurations
- **SeederSummary**: Interface for seeder result summary

### Validation
- **validateEventSeedData()**: Validates event data structure and types
- **validateEventRankPrizeSeedData()**: Validates prize data structure and types
- **Type Guards**: Runtime type checking for better error detection

## 📁 File Structure

```
src/database/
├── seeds/
│   ├── event.seed.ts                    # Enhanced seeder with types
│   ├── types/
│   │   └── event-seed.types.ts          # TypeScript types and validation
│   └── README-EVENT-SEEDER.md           # This documentation
├── data-seed/
│   ├── event.seed.json                  # Event seed data
│   └── event-rank-prize.seed.json       # Prize configuration data
└── entities/
    ├── event.entity.ts                  # Event entity definition
    └── event-rank-prize.entity.ts       # Prize entity definition
```

## 🎯 Features

### Enhanced Seeder (event.seed.ts)
- ✅ **Type Safety**: Full TypeScript type checking
- ✅ **Data Validation**: Runtime validation of seed data
- ✅ **Error Handling**: Comprehensive error reporting
- ✅ **UUID Generation**: Proper UUID v4 format for eventHash
- ✅ **Detailed Logging**: Progress tracking and summary reporting
- ✅ **Duplicate Prevention**: Checks for existing events and prizes
- ✅ **Maintainability**: Clean, documented code structure

### Seed Data Structure

#### Event Data (event.seed.json)
```json
{
  "name": "Event Name",
  "description": "Event description",
  "totalPrize": "500000",
  "startDate": "2025-01-15T00:00:00.000Z",
  "endDate": "2025-02-15T23:59:59.000Z",
  "status": "ACTIVE",
  "type": "TRADING_COMPETITION",
  "tradeToken": "token_hash",
  "tradeDex": "ALL_DEX",
  "icon": "/path/to/icon.png",
  "banner": "/path/to/banner.png",
  "url": "https://app.spidex.ag/events/event-url",
  "eventHash": "unique-uuid-v4",
  "customData": [
    {
      "key": "luckyDraw",
      "type": "text",
      "value": "5 Lucky Draw: 5,000 $ROLL/person"
    }
  ]
}
```

#### Prize Data (event-rank-prize.seed.json)
```json
{
  "eventId": 15,
  "rankFrom": 1,
  "rankTo": 1,
  "prizePoints": "0.0",
  "prizeToken": "token_hash",
  "prizeTokenAmount": "150000.0",
  "description": "🥇 Top 1: 150,000 $ROLL"
}
```

## 📊 Current Seed Data

### Spidex AI x Farmroll Trading Showdown (Event ID: 15)

**Event Details:**
- **Prize Pool**: 500,000 $ROLL
- **Duration**: January 15 - February 15, 2025
- **Type**: Trading Competition
- **Status**: Active

**Prize Structure:**
| Rank | Prize | Description |
|------|-------|-------------|
| 🥇 1st | 150,000 $ROLL | Top Volume Trader |
| 🥈 2nd | 100,000 $ROLL | Second highest volume |
| 🥉 3rd | 50,000 $ROLL | Third highest volume |
| 🏅 4th-10th | 25,000 $ROLL each | 175,000 $ROLL total (7 winners) |
| 🎲 Lucky Draw | 5,000 $ROLL each | 25,000 $ROLL total (5 winners) |

## 🚀 Usage

### Running the Seeder
```bash
# Run all seeders
yarn db:seed

# Run specific event seeder
yarn db:seed -n EventSeeder
```

### Expected Output
```
🎯 Starting Event Seeder...
✅ Validated 15 events and 44 prize configurations
✅ Created event: "Spidex AI x Farmroll Trading Showdown!" (ID: 29)
   🏆 Processed 5 prize configurations

==================================================
🎯 EVENT SEEDER SUMMARY
==================================================
📊 Total Events in Seed Data: 15
📝 New Events Created: 15
🏆 New Prize Configurations: 44
💰 Total Prize Pool: $995,000
==================================================
✅ Event seeding completed successfully!
```

## 🔧 Development

### Adding New Events

1. **Add Event Data** to `event.seed.json`:
   - Use proper TypeScript types
   - Include all required fields
   - Generate unique eventHash (UUID v4)

2. **Add Prize Data** to `event-rank-prize.seed.json`:
   - Use eventId matching array index + 1
   - Define rank ranges and prize amounts
   - Include descriptive text

3. **Run Validation**:
   ```bash
   yarn db:seed -n EventSeeder
   ```

### Validation Rules

**Event Data:**
- ✅ All required fields present
- ✅ Valid enum values for status and type
- ✅ Proper date format
- ✅ Non-empty strings for required fields

**Prize Data:**
- ✅ Valid eventId reference
- ✅ Rank ranges (rankFrom ≤ rankTo)
- ✅ Positive rank values
- ✅ Non-empty description

## 🐛 Troubleshooting

### Common Issues

1. **UUID Format Error**
   ```
   Error: invalid input syntax for type uuid
   ```
   - **Solution**: Ensure eventHash is proper UUID v4 format

2. **Validation Error**
   ```
   Error: Event seed data validation failed
   ```
   - **Solution**: Check TypeScript types match expected structure

3. **Duplicate Event**
   ```
   ⏭️ Event already exists
   ```
   - **Expected**: Seeder prevents duplicates by eventHash

### Debug Mode
Enable detailed logging by checking the seeder output for validation messages and error details.

## 📈 Monitoring

The seeder provides comprehensive statistics:
- Events created vs. existing
- Prize configurations processed
- Total prize pool calculation
- Event status distribution
- Processing time and performance

This enhanced seeder ensures data integrity, maintainability, and provides clear feedback for development and deployment operations.