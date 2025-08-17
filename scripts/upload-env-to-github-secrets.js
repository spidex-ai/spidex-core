#!/usr/bin/env node

/**
 * Script to upload .env variables to GitHub repository secrets
 *
 * Prerequisites:
 * 1. Install GitHub CLI: https://cli.github.com/
 * 2. Authenticate with GitHub CLI: gh auth login
 * 3. Make sure you have admin access to the repository
 *
 * Usage:
 * node scripts/upload-env-to-github-secrets.js
 *
 * Or with custom .env file:
 * node scripts/upload-env-to-github-secrets.js --env-file=.env.production
 */

const { readFileSync, existsSync } = require('fs');
const { execSync } = require('child_process');
const { join } = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const envFileArg = args.find(arg => arg.startsWith('--env-file='));
const envFile = envFileArg ? envFileArg.split('=')[1] : '.env';
const dryRun = args.includes('--dry-run');

// Resolve path relative to project root
const projectRoot = join(__dirname, '..');
const envFilePath = join(projectRoot, envFile);

console.log(`🔍 Looking for environment file: ${envFilePath}`);

// Check if .env file exists
if (!existsSync(envFilePath)) {
  console.error(`❌ Error: ${envFile} file not found at ${envFilePath}`);
  process.exit(1);
}

// Check if GitHub CLI is installed
try {
  execSync('gh --version', { stdio: 'pipe' });
  console.log('✅ GitHub CLI is installed');
} catch (error) {
  console.error('❌ Error: GitHub CLI is not installed or not in PATH');
  console.error('Please install it from: https://cli.github.com/');
  process.exit(1);
}

// Check if user is authenticated with GitHub CLI
try {
  execSync('gh auth status', { stdio: 'pipe' });
  console.log('✅ GitHub CLI is authenticated');
} catch (error) {
  console.error('❌ Error: Not authenticated with GitHub CLI');
  console.error('Please run: gh auth login');
  process.exit(1);
}

// Get repository information
let repoInfo = null;
try {
  const repoOutput = execSync('gh repo view --json owner,name', {
    stdio: 'pipe',
    cwd: projectRoot,
  }).toString();
  repoInfo = JSON.parse(repoOutput);
  console.log(`✅ Repository detected: ${repoInfo.owner.login}/${repoInfo.name}`);
} catch (error) {
  console.warn('⚠️  Warning: Could not detect repository information');
  console.warn('   Make sure you are in a GitHub repository directory');
}

// Read and parse .env file
console.log(`📖 Reading ${envFile}...`);
const envContent = readFileSync(envFilePath, 'utf8');
const envVars = {};

// Parse .env file
envContent.split('\n').forEach((line, index) => {
  line = line.trim();

  // Skip empty lines and comments
  if (!line || line.startsWith('#')) {
    return;
  }

  // Parse KEY=VALUE format
  const equalIndex = line.indexOf('=');
  if (equalIndex === -1) {
    console.warn(`⚠️  Warning: Skipping invalid line ${index + 1}: ${line}`);
    return;
  }

  const key = line.substring(0, equalIndex).trim();
  const value = line.substring(equalIndex + 1).trim();

  // Remove quotes if present
  const cleanValue = value.replace(/^["']|["']$/g, '');

  if (key) {
    envVars[key] = cleanValue;
  }
});

const envVarCount = Object.keys(envVars).length;
console.log(`📝 Found ${envVarCount} environment variables`);

if (envVarCount === 0) {
  console.log('ℹ️  No environment variables found to upload');
  process.exit(0);
}

// Display variables that will be uploaded
console.log('\n📋 Environment variables to upload:');
Object.keys(envVars).forEach(key => {
  const value = envVars[key];
  const maskedValue =
    value.length > 10
      ? value.substring(0, 4) + '*'.repeat(value.length - 8) + value.substring(value.length - 4)
      : '*'.repeat(value.length);
  console.log(`  ${key}=${maskedValue}`);
});

if (dryRun) {
  console.log('\n🔍 Dry run mode - no secrets will be uploaded');
  process.exit(0);
}

// Confirm before uploading
console.log('\n⚠️  This will upload the above environment variables as GitHub repository secrets.');
console.log('⚠️  Existing secrets with the same names will be overwritten.');

// In a real script, you might want to add a confirmation prompt
// For automation purposes, we'll proceed directly

console.log('\n🚀 Uploading secrets to GitHub...');

let successCount = 0;
let errorCount = 0;

// Upload each environment variable as a secret
for (const [key, value] of Object.entries(envVars)) {
  try {
    console.log(`📤 Uploading ${key}: ${value}`);

    // Use GitHub CLI to set the secret
    execSync(`gh secret set ${key} --body "${value.replace(/"/g, '\\"')}"`, {
      stdio: 'pipe',
      cwd: projectRoot,
    });

    console.log(`✅ Successfully uploaded ${key}`);
    successCount++;
  } catch (error) {
    console.error(`❌ Failed to upload ${key}:`, error.message);
    errorCount++;
  }
}

// Summary
console.log('\n📊 Upload Summary:');
console.log(`✅ Successfully uploaded: ${successCount} secrets`);
if (errorCount > 0) {
  console.log(`❌ Failed to upload: ${errorCount} secrets`);
}

if (successCount > 0) {
  console.log('\n🎉 Environment variables have been uploaded to GitHub secrets!');
  if (repoInfo) {
    console.log(
      `🔗 You can view them at: https://github.com/${repoInfo.owner.login}/${repoInfo.name}/settings/secrets/actions`,
    );
  } else {
    console.log('🔗 You can view them at: https://github.com/OWNER/REPO/settings/secrets/actions');
    console.log('   (Replace OWNER/REPO with your actual repository)');
  }
}

if (errorCount > 0) {
  process.exit(1);
}
