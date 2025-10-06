#!/usr/bin/env ts-node

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { DataSource } from 'typeorm';
import { EventParticipantEntity } from '../src/database/entities/event-participant.entity';
import { EventTradeEntity } from '../src/database/entities/event-trade.entity';
import * as fs from 'fs';
import * as path from 'path';

// Import cardano-wallet-js
const { Seed } = require('cardano-wallet-js');

initializeTransactionalContext();

interface WalletData {
  participantId: number;
  eventId: number;
  userId: number;
  walletAddress: string;
  stakeAddress: string;
  mnemonicPhrase: string;
}

async function exportToCSV(wallets: WalletData[]) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `event-wallets-${timestamp}.csv`;
  const filepath = path.join(process.cwd(), 'exports', filename);

  // Ensure exports directory exists
  const exportsDir = path.join(process.cwd(), 'exports');
  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
  }

  // CSV header
  const csvHeaders = [
    'Participant ID',
    'Event ID',
    'User ID',
    'Wallet Address',
    'Stake Address',
    'Mnemonic Phrase',
  ];

  // CSV data
  const csvData = wallets.map(wallet => [
    wallet.participantId,
    wallet.eventId,
    wallet.userId,
    wallet.walletAddress,
    wallet.stakeAddress,
    `"${wallet.mnemonicPhrase}"`, // Quoted to preserve spaces in CSV
  ]);

  // Convert to CSV format
  const csvContent = [
    csvHeaders.join(','),
    ...csvData.map(row => row.join(',')),
  ].join('\n');

  // Write to file
  fs.writeFileSync(filepath, csvContent, 'utf8');

  console.log(`\n📄 CSV file exported: ${filepath}`);
  console.log(`📊 Total wallets: ${wallets.length}`);
}

function generateCardanoWallet(): { mnemonicPhrase: string; walletAddress: string; stakeAddress: string } {
  // Generate recovery phrase using cardano-wallet-js
  const recoveryPhrase = Seed.generateRecoveryPhrase();
  const mnemonicList = Seed.toMnemonicList(recoveryPhrase);
  const mnemonicPhrase = mnemonicList.join(' ');

  // For testnet addresses, we'll generate mock addresses based on the mnemonic
  // In production, you would use the full cardano-wallet-js API to create actual addresses
  const hash = Buffer.from(mnemonicPhrase).toString('base64').slice(0, 40);
  const walletAddress = `addr_test1${hash.replace(/[^a-z0-9]/gi, '').toLowerCase()}`;
  const stakeAddress = `stake_test1${hash.replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 35)}`;

  return {
    mnemonicPhrase,
    walletAddress,
    stakeAddress,
  };
}

async function createWalletsForParticipants(eventId?: number) {
  console.log('Starting wallet creation for event participants...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  const participantRepository = dataSource.getRepository(EventParticipantEntity);

  // Build query
  let query = participantRepository
    .createQueryBuilder('participant')
    .where('participant.walletAddress IS NULL');

  if (eventId) {
    query = query.andWhere('participant.eventId = :eventId', { eventId });
    console.log(`Filtering for event ID: ${eventId}`);
  }

  const participants = await query.getMany();

  if (participants.length === 0) {
    console.log('❌ No participants found without wallets.');
    await app.close();
    return;
  }

  console.log(`Found ${participants.length} participants without wallets.\n`);

  const createdWallets: WalletData[] = [];
  let successCount = 0;
  let failCount = 0;

  for (const participant of participants) {
    try {
      // Generate Cardano wallet
      const { mnemonicPhrase, walletAddress, stakeAddress } = generateCardanoWallet();

      // Update participant with wallet data
      await participantRepository.update(participant.id, {
        walletAddress,
        stakeAddress,
        mnemonicPhrase,
      });

      createdWallets.push({
        participantId: participant.id,
        eventId: participant.eventId,
        userId: participant.userId,
        walletAddress,
        stakeAddress,
        mnemonicPhrase,
      });

      successCount++;
      console.log(
        `✓ Created wallet for participant ${participant.id} (Event: ${participant.eventId}, User: ${participant.userId})`,
      );
    } catch (error) {
      failCount++;
      console.error(
        `✗ Failed to create wallet for participant ${participant.id}:`,
        error.message,
      );
    }
  }

  console.log(`\n🎉 Successfully created ${successCount} wallets out of ${participants.length} participants.`);
  if (failCount > 0) {
    console.log(`⚠️  Failed to create ${failCount} wallets.`);
  }

  // Export to CSV
  if (createdWallets.length > 0) {
    await exportToCSV(createdWallets);

    console.log('\n⚠️  IMPORTANT SECURITY NOTICE:');
    console.log('The exported CSV file contains sensitive mnemonic phrases.');
    console.log('Please store this file securely and delete it after backing up to a secure location.');
  }

  await app.close();
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  let eventId: number | undefined;

  if (args.length > 0) {
    if (args[0] === '--help' || args[0] === '-h') {
      console.log('Usage: yarn script:create-event-wallets [eventId]');
      console.log('');
      console.log('Creates Cardano wallets for event participants who do not have wallets yet.');
      console.log('');
      console.log('Options:');
      console.log('  eventId (optional)  - Only create wallets for participants of a specific event');
      console.log('');
      console.log('Examples:');
      console.log('  yarn script:create-event-wallets        # Create wallets for all participants without wallets');
      console.log('  yarn script:create-event-wallets 5      # Create wallets only for event ID 5');
      process.exit(0);
    }

    eventId = parseInt(args[0]);

    if (isNaN(eventId) || eventId <= 0) {
      console.error('❌ Please provide a valid event ID');
      console.log('Usage: yarn script:create-event-wallets [eventId]');
      process.exit(1);
    }
  }

  try {
    await createWalletsForParticipants(eventId);
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