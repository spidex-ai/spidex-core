#!/usr/bin/env ts-node

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UserEntity } from '../src/database/entities/user.entity';
import { UserService } from '../src/modules/user/user.service';
import { initializeTransactionalContext } from 'typeorm-transactional';
import * as fs from 'fs';
import * as path from 'path';

initializeTransactionalContext();

async function exportToCSV(users: UserEntity[], referralLink: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `created-users-${timestamp}.csv`;
  const filepath = path.join(process.cwd(), 'exports', filename);

  // Ensure exports directory exists
  const exportsDir = path.join(process.cwd(), 'exports');
  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
  }

  // CSV header
  const csvHeaders = [
    'ID',
    'Username',
    'Wallet Address',
    'Stake Address',
    'Referral Code',
    'Referral Link',
    'Status',
    'Created At',
    'Last Used Wallet',
  ];

  // CSV data
  const csvData = users.map(user => [
    (user as any).id,
    user.username,
    user.walletAddress,
    user.stakeAddress,
    user.referralCode,
    `${referralLink}${user.referralCode}`,
    user.status,
    (user as any).createdAt ? new Date((user as any).createdAt).toISOString() : '',
    user.lastUsedWallet || '',
  ]);

  // Convert to CSV format
  const csvContent = [
    csvHeaders.join(','),
    ...csvData.map(row =>
      row.map(field => (typeof field === 'string' && field.includes(',') ? `"${field}"` : field)).join(','),
    ),
  ].join('\n');

  // Write to file
  fs.writeFileSync(filepath, csvContent, 'utf8');

  console.log(`\n📄 CSV file exported: ${filepath}`);
  console.log(`📊 Total records: ${users.length}`);
}

async function createUsers(count: number) {
  console.log(`Creating ${count} users...`);

  const app = await NestFactory.createApplicationContext(AppModule);
  const userService = app.get(UserService);

  const createdUsers: UserEntity[] = [];

  for (let i = 1; i <= count; i++) {
    try {
      // Generate fake wallet addresses (for testing purposes)
      const walletAddress = `addr_test1_fake_wallet_${i}_${Math.random().toString(36).substring(2, 15)}`;
      const stakeAddress = `stake_test1_fake_stake_${i}_${Math.random().toString(36).substring(2, 15)}`;

      // Create user using the connectWallet method (without userId to create new user)
      const user = await userService.connectWallet({
        address: walletAddress,
        stakeAddress: stakeAddress,
        walletType: 'lace', // Default wallet type
      });

      createdUsers.push(user);
      console.log(
        `✓ Created user ${i}/${count} - ID: ${user.id}, Username: ${user.username}, Wallet: ${user.walletAddress}`,
      );
    } catch (error) {
      console.error(`✗ Failed to create user ${i}/${count}:`, error.message);
    }
  }

  console.log(`\n🎉 Successfully created ${createdUsers.length} users out of ${count} requested.`);

  // Display summary and export to CSV
  const referralLink = `https://app.spidex.ag/chat?ref=`;
  if (createdUsers.length > 0) {
    console.log('\n📊 Created Users Summary:');
    createdUsers.forEach((user, index) => {
      console.log(
        `${index + 1}. ID: ${(user as any).id} | Username: ${user.username} | Referral Code: ${referralLink}${user.referralCode}`,
      );
    });

    // Export to CSV
    await exportToCSV(createdUsers, referralLink);
  }

  await app.close();
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('❌ Please provide the number of users to create');
    console.log('Usage: yarn script:create-users <number>');
    console.log('Example: yarn script:create-users 10');
    process.exit(1);
  }

  const count = parseInt(args[0]);

  if (isNaN(count) || count <= 0) {
    console.error('❌ Please provide a valid positive number');
    console.log('Example: yarn script:create-users 10');
    process.exit(1);
  }

  if (count > 1000) {
    console.error('❌ Maximum 1000 users allowed per run to prevent database overload');
    process.exit(1);
  }

  try {
    await createUsers(count);
    console.log('✅ Script completed successfully');
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
