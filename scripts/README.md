# GitHub Secrets Upload Scripts

This directory contains scripts to automatically upload environment variables from `.env` files to GitHub repository secrets.

## Prerequisites

1. **Install GitHub CLI**: https://cli.github.com/
2. **Authenticate with GitHub CLI**: Run `gh auth login`
3. **Repository Access**: Make sure you have admin access to the repository

## Available Scripts

### 1. Node.js Script (`upload-env-to-github-secrets.js`)

A Node.js script that reads your `.env` file and uploads each variable as a GitHub secret.

**Usage:**
```bash
# Upload from default .env file
node scripts/upload-env-to-github-secrets.js

# Upload from custom .env file
node scripts/upload-env-to-github-secrets.js --env-file=.env.production

# Dry run (see what would be uploaded without actually uploading)
node scripts/upload-env-to-github-secrets.js --dry-run
```

### 2. Shell Script (`upload-env-to-github-secrets.sh`)

A bash script that provides the same functionality with additional features.

**Usage:**
```bash
# Make the script executable (first time only)
chmod +x scripts/upload-env-to-github-secrets.sh

# Upload from default .env file
./scripts/upload-env-to-github-secrets.sh

# Upload from custom .env file
./scripts/upload-env-to-github-secrets.sh .env.production

# Dry run
./scripts/upload-env-to-github-secrets.sh --dry-run

# Help
./scripts/upload-env-to-github-secrets.sh --help
```

## Features

- ✅ **Safe Parsing**: Properly handles `.env` file format with comments and empty lines
- ✅ **Value Masking**: Shows masked values in output for security
- ✅ **Dry Run Mode**: Preview what will be uploaded without actually uploading
- ✅ **Error Handling**: Comprehensive error checking and reporting
- ✅ **Prerequisites Check**: Verifies GitHub CLI installation and authentication
- ✅ **Multiple File Support**: Can work with different `.env` files
- ✅ **Progress Feedback**: Clear output showing upload progress and results

## Security Notes

- **Values are masked** in console output for security
- **Existing secrets will be overwritten** if they have the same name
- **Make sure your `.env` file is in `.gitignore`** to avoid committing secrets
- **Only run these scripts from a secure environment**

## Current Environment Variables

Based on your current `.env` file, these variables will be uploaded:

- `PUBLIC_DISCORD_CLIENT_ID`
- `PUBLIC_TELEGRAM_BOT_USERNAME`
- `PUBLIC_APP_URL`
- `PUBLIC_API_URL`

## GitHub Secrets Location

After uploading, you can view your secrets at:
`https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions`

## Troubleshooting

### GitHub CLI Not Found
```bash
# Install GitHub CLI (macOS)
brew install gh

# Install GitHub CLI (Linux)
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh
```

### Authentication Issues
```bash
# Login to GitHub CLI
gh auth login

# Check authentication status
gh auth status
```

### Permission Issues
Make sure you have admin access to the repository or the "Secrets" permission in your organization.
