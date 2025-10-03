#!/usr/bin/env ts-node

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { DataSource } from 'typeorm';
import { UserEntity } from '../src/database/entities/user.entity';
import { EventParticipantEntity } from '../src/database/entities/event-participant.entity';
import { EventTradeEntity } from '../src/database/entities/event-trade.entity';
import { SwapTransactionEntity, SwapAction, SwapStatus } from '../src/database/entities/swap-transaction.entity';
import { EEventTradeType } from '../src/modules/event/event.constant';
import { UserService } from '../src/modules/user/user.service';
import { Decimal } from 'decimal.js';
import * as fs from 'fs';
import * as path from 'path';

// Import cardano-wallet-js
const { Seed, WalletServer } = require('cardano-wallet-js');

initializeTransactionalContext();

// Wallet server configuration - set via environment variable or use default
const WALLET_SERVER_URL = process.env.CARDANO_WALLET_SERVER_URL || 'http://localhost:8090/v2';
const WALLET_PASSPHRASE = process.env.WALLET_PASSPHRASE || 'spidex-wallet-passphrase';

interface CreatedUserData {
  userId: number;
  username: string;
  walletAddress: string;
  stakeAddress: string;
  mnemonicPhrase: string;
  participantId: number;
  eventId: number;
  totalTrades: number;
  totalVolume: string;
  walletId?: string;
}

interface ScriptOptions {
  eventId: number;
  userCount: number;
  tradesPerUser: { min: number; max: number };
  volumePerTrade: { min: number; max: number };
  useRealWallet: boolean;
}

async function generateCardanoWallet(
  walletName: string,
  useRealWallet: boolean,
): Promise<{
  mnemonicPhrase: string;
  walletAddress: string;
  stakeAddress: string;
  walletId?: string;
}> {
  // Generate recovery phrase
  const recoveryPhrase = Seed.generateRecoveryPhrase();
  const mnemonicSentence = Seed.toMnemonicList(recoveryPhrase);
  const mnemonicPhrase = mnemonicSentence.join(' ');

  if (useRealWallet) {
    try {
      // Initialize wallet server
      console.log(`  → Connecting to wallet server: ${WALLET_SERVER_URL}`);
      const walletServer = WalletServer.init(WALLET_SERVER_URL);

      // Create wallet on the server
      console.log(`  → Creating wallet "${walletName}" on server...`);
      const wallet = await walletServer.createOrRestoreShelleyWallet(walletName, mnemonicSentence, WALLET_PASSPHRASE);

      console.log(`  ✓ Wallet created with ID: ${wallet.id}`);
      console.log(`  → Fetching addresses...`);

      // Get the first address
      const addresses = await walletServer.getAddresses(wallet.id);
      const paymentAddress = addresses[0]?.id || '';

      if (!paymentAddress) {
        throw new Error('No payment address returned from wallet server');
      }

      return {
        mnemonicPhrase,
        walletAddress: paymentAddress,
        stakeAddress: wallet.delegation?.active?.target || wallet.state?.delegation?.target || '',
        walletId: wallet.id,
      };
    } catch (error) {
      console.error(`  ⚠️  Wallet server error: ${error.message}`);
      if (error.response) {
        console.error(`  ⚠️  Response: ${JSON.stringify(error.response)}`);
      }
      console.error(`  ⚠️  Falling back to testnet addresses`);
      // Fall back to testnet generation
      return generateTestnetWallet(mnemonicPhrase);
    }
  } else {
    // Generate testnet addresses (for testing without wallet server)
    return generateTestnetWallet(mnemonicPhrase);
  }
}

function generateTestnetWallet(mnemonicPhrase: string): {
  mnemonicPhrase: string;
  walletAddress: string;
  stakeAddress: string;
} {
  const hash = Buffer.from(mnemonicPhrase).toString('base64').slice(0, 40);
  const walletAddress = `addr_${hash.replace(/[^a-z0-9]/gi, '').toLowerCase()}`;
  const stakeAddress = `stake_${hash
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase()
    .slice(0, 35)}`;

  return {
    mnemonicPhrase,
    walletAddress,
    stakeAddress,
  };
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDecimal(min: number, max: number): string {
  const value = Math.random() * (max - min) + min;
  return value.toFixed(6);
}

async function exportToCSV(users: CreatedUserData[]) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `event-users-trades-${timestamp}.csv`;
  const filepath = path.join(process.cwd(), 'exports', filename);

  // Ensure exports directory exists
  const exportsDir = path.join(process.cwd(), 'exports');
  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
  }

  // CSV header
  const csvHeaders = [
    'User ID',
    'Username',
    'Wallet Address',
    'Stake Address',
    'Wallet ID',
    'Mnemonic Phrase',
    'Participant ID',
    'Event ID',
    'Total Trades',
    'Total Volume (USD)',
  ];

  // CSV data
  const csvData = users.map(user => [
    user.userId,
    user.username,
    user.walletAddress,
    user.stakeAddress,
    user.walletId || 'N/A',
    `"${user.mnemonicPhrase}"`,
    user.participantId,
    user.eventId,
    user.totalTrades,
    user.totalVolume,
  ]);

  // Convert to CSV format
  const csvContent = [csvHeaders.join(','), ...csvData.map(row => row.join(','))].join('\n');

  // Write to file
  fs.writeFileSync(filepath, csvContent, 'utf8');

  console.log(`\n📄 CSV file exported: ${filepath}`);
  console.log(`📊 Total users: ${users.length}`);
}

async function createEventUsersWithTrades(options: ScriptOptions) {
  console.log('🚀 Starting event users and trades creation...\n');
  console.log('Options:', {
    eventId: options.eventId,
    userCount: options.userCount,
    tradesPerUser: `${options.tradesPerUser.min}-${options.tradesPerUser.max}`,
    volumePerTrade: `$${options.volumePerTrade.min}-$${options.volumePerTrade.max}`,
  });
  console.log('');

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const userService = app.get(UserService);

  // Verify event exists using raw query to avoid entity metadata issues
  const eventCheck = await dataSource.query('SELECT id, name FROM events WHERE id = $1 AND deleted_at IS NULL', [
    options.eventId,
  ]);

  if (!eventCheck || eventCheck.length === 0) {
    console.error(`❌ Event with ID ${options.eventId} not found`);
    await app.close();
    process.exit(1);
  }

  const event = eventCheck[0];

  console.log(`✓ Event found: "${event.name}" (ID: ${options.eventId})`);
  console.log('');

  const userRepo = dataSource.getRepository(UserEntity);
  const participantRepo = dataSource.getRepository(EventParticipantEntity);
  const tradeRepo = dataSource.getRepository(EventTradeEntity);
  const swapTxRepo = dataSource.getRepository(SwapTransactionEntity);

  const createdUsers: CreatedUserData[] = [];
  let totalTradesCreated = 0;

  for (let i = 1; i <= options.userCount; i++) {
    try {
      console.log(`[${i}/${options.userCount}] Creating user and trades...`);

      // Step 1: Generate Cardano wallet
      const walletName = `spidex-user-${Date.now()}-${i}`;
      const { mnemonicPhrase, walletAddress, stakeAddress, walletId } = await generateCardanoWallet(
        walletName,
        options.useRealWallet,
      );
      console.log(`  ✓ Generated wallet: ${walletAddress.substring(0, 20)}...`);

      // Step 2: Create user via UserService
      const user = await userService.connectWallet({
        address: walletAddress,
        stakeAddress: stakeAddress,
        walletType: 'lace',
      });
      console.log(`  ✓ Created user: ${user.username} (ID: ${user.id})`);

      // Step 3: Create event participant (wallet info already stored in user entity)
      const participant = participantRepo.create({
        eventId: options.eventId,
        userId: user.id,
        totalVolume: '0',
        tradeCount: 0,
        joinedAt: new Date(),
      });
      await participantRepo.save(participant);
      console.log(`  ✓ Created participant (ID: ${participant.id})`);

      // Step 4: Create random number of trades for this user
      const numTrades = randomBetween(options.tradesPerUser.min, options.tradesPerUser.max);
      let userTotalVolume = new Decimal(0);

      for (let t = 1; t <= numTrades; t++) {
        const volumeUsd = randomDecimal(options.volumePerTrade.min, options.volumePerTrade.max);
        const tradeType = Math.random() > 0.5 ? EEventTradeType.BUY : EEventTradeType.SELL;
        const swapAction = tradeType === EEventTradeType.BUY ? SwapAction.BUY : SwapAction.SELL;

        // Create swap transaction
        const swapTx = swapTxRepo.create({
          userId: user.id,
          action: swapAction,
          status: SwapStatus.SUCCESS,
          address: walletAddress,
          txHash: `tx_${Date.now()}_${user.id}_${t}_${Math.random().toString(36).substring(7)}`,
          exchange: 'minswap',
          tokenA: 'ADA',
          tokenAAmount: randomDecimal(100, 10000),
          tokenAName: 'Cardano',
          tokenB: 'SPIDEX',
          tokenBAmount: randomDecimal(1000, 100000),
          tokenBName: 'SpideX Token',
          cborHex: `cbor_hex_${Math.random().toString(36).substring(7)}`,
          totalFee: parseFloat(randomDecimal(0.1, 2)),
          totalUsd: volumeUsd,
          timestamp: new Date(),
        });
        await swapTxRepo.save(swapTx);

        // Create event trade
        const eventTrade = tradeRepo.create({
          eventId: options.eventId,
          participantId: participant.id,
          swapTransactionId: swapTx.id,
          volumeUsd: volumeUsd,
          tokenTraded: 'SPIDEX',
          tokenAmount: swapTx.tokenBAmount,
          tradeType,
          recordedAt: new Date(),
        });
        await tradeRepo.save(eventTrade);

        userTotalVolume = userTotalVolume.add(new Decimal(volumeUsd));
        totalTradesCreated++;
      }

      // Step 5: Update participant totals
      await participantRepo.update(participant.id, {
        totalVolume: userTotalVolume.toFixed(2),
        tradeCount: numTrades,
        lastTradeAt: new Date(),
      });

      console.log(`  ✓ Created ${numTrades} trades with total volume: $${userTotalVolume.toFixed(2)}`);

      createdUsers.push({
        userId: user.id,
        username: user.username,
        walletAddress,
        stakeAddress,
        mnemonicPhrase,
        participantId: participant.id,
        eventId: options.eventId,
        totalTrades: numTrades,
        totalVolume: userTotalVolume.toFixed(2),
        walletId,
      });

      console.log('');
    } catch (error) {
      console.error(`  ✗ Failed to create user ${i}:`, error.message);
      console.log('');
    }
  }

  console.log('═══════════════════════════════════════════════════════');
  console.log('🎉 Summary:');
  console.log(`  • Users created: ${createdUsers.length}/${options.userCount}`);
  console.log(`  • Participants created: ${createdUsers.length}`);
  console.log(`  • Total trades created: ${totalTradesCreated}`);
  console.log(`  • Total volume: $${createdUsers.reduce((sum, u) => sum + parseFloat(u.totalVolume), 0).toFixed(2)}`);
  console.log('═══════════════════════════════════════════════════════');

  // Export to CSV
  if (createdUsers.length > 0) {
    await exportToCSV(createdUsers);

    console.log('\n⚠️  IMPORTANT SECURITY NOTICE:');
    console.log('The exported CSV file contains sensitive mnemonic phrases.');
    console.log('Please store this file securely and delete it after backing up to a secure location.');
  }

  await app.close();
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log('Usage: yarn script:create-event-users-with-trades <eventId> <userCount> [options]');
    console.log('');
    console.log('Creates users with Cardano wallets, joins them to an event, and generates trades.');
    console.log('');
    console.log('Arguments:');
    console.log('  eventId              - Event ID to add participants to');
    console.log('  userCount            - Number of users to create');
    console.log('');
    console.log('Options:');
    console.log('  --min-trades <num>   - Minimum trades per user (default: 1)');
    console.log('  --max-trades <num>   - Maximum trades per user (default: 5)');
    console.log('  --min-volume <num>   - Minimum volume per trade in USD (default: 10)');
    console.log('  --max-volume <num>   - Maximum volume per trade in USD (default: 50)');
    console.log('  --real-wallet        - Use real Cardano wallet server instead of testnet addresses');
    console.log('');
    console.log('Environment Variables:');
    console.log('  CARDANO_WALLET_SERVER_URL  - Wallet server URL (default: http://localhost:8090/v2)');
    console.log('  WALLET_PASSPHRASE          - Wallet passphrase (default: spidex-wallet-passphrase)');
    console.log('');
    console.log('Examples:');
    console.log('  yarn script:create-event-users-with-trades 1 10');
    console.log('  yarn script:create-event-users-with-trades 1 50 --min-trades 3 --max-trades 15');
    console.log('  yarn script:create-event-users-with-trades 1 100 --min-volume 50 --max-volume 5000');
    console.log('  yarn script:create-event-users-with-trades 1 10 --real-wallet');
    process.exit(0);
  }

  const eventId = parseInt(args[0]);
  const userCount = parseInt(args[1]);

  if (isNaN(eventId) || eventId <= 0) {
    console.error('❌ Please provide a valid event ID');
    process.exit(1);
  }

  if (isNaN(userCount) || userCount <= 0) {
    console.error('❌ Please provide a valid user count');
    process.exit(1);
  }

  if (userCount > 1000) {
    console.error('❌ Maximum 1000 users allowed per run to prevent database overload');
    process.exit(1);
  }

  // Parse options
  const options: ScriptOptions = {
    eventId,
    userCount,
    tradesPerUser: { min: 1, max: 5 },
    volumePerTrade: { min: 10, max: 50 },
    useRealWallet: false,
  };

  for (let i = 2; i < args.length; i++) {
    switch (args[i]) {
      case '--min-trades':
        options.tradesPerUser.min = parseInt(args[++i]);
        break;
      case '--max-trades':
        options.tradesPerUser.max = parseInt(args[++i]);
        break;
      case '--min-volume':
        options.volumePerTrade.min = parseFloat(args[++i]);
        break;
      case '--max-volume':
        options.volumePerTrade.max = parseFloat(args[++i]);
        break;
      case '--real-wallet':
        options.useRealWallet = true;
        break;
    }
  }

  // Validate options
  if (options.tradesPerUser.min > options.tradesPerUser.max) {
    console.error('❌ min-trades cannot be greater than max-trades');
    process.exit(1);
  }

  if (options.volumePerTrade.min > options.volumePerTrade.max) {
    console.error('❌ min-volume cannot be greater than max-volume');
    process.exit(1);
  }

  try {
    await createEventUsersWithTrades(options);
    console.log('\n✅ Script completed successfully');
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
