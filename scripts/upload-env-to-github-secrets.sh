#!/bin/bash

# Script to upload .env variables to GitHub repository secrets
#
# Prerequisites:
# 1. Install GitHub CLI: https://cli.github.com/
# 2. Authenticate with GitHub CLI: gh auth login
# 3. Make sure you have admin access to the repository
#
# Usage:
# ./scripts/upload-env-to-github-secrets.sh
#
# Or with custom .env file:
# ./scripts/upload-env-to-github-secrets.sh .env.production
#
# Or dry run mode:
# ./scripts/upload-env-to-github-secrets.sh --dry-run

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENV_FILE=".env"
DRY_RUN=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [ENV_FILE] [--dry-run] [--help]"
            echo ""
            echo "Arguments:"
            echo "  ENV_FILE    Path to .env file (default: .env)"
            echo "  --dry-run   Show what would be uploaded without actually uploading"
            echo "  --help      Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                           # Upload from .env"
            echo "  $0 .env.production          # Upload from .env.production"
            echo "  $0 --dry-run                # Dry run with .env"
            echo "  $0 .env.staging --dry-run   # Dry run with .env.staging"
            exit 0
            ;;
        *)
            if [[ ! "$1" =~ ^-- ]]; then
                ENV_FILE="$1"
            fi
            shift
            ;;
    esac
done

echo -e "${BLUE}🔍 Looking for environment file: $ENV_FILE${NC}"

# Check if .env file exists
if [[ ! -f "$ENV_FILE" ]]; then
    echo -e "${RED}❌ Error: $ENV_FILE file not found${NC}"
    exit 1
fi

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ Error: GitHub CLI is not installed or not in PATH${NC}"
    echo -e "${YELLOW}Please install it from: https://cli.github.com/${NC}"
    exit 1
fi

echo -e "${GREEN}✅ GitHub CLI is installed${NC}"

# Check if user is authenticated with GitHub CLI
if ! gh auth status &> /dev/null; then
    echo -e "${RED}❌ Error: Not authenticated with GitHub CLI${NC}"
    echo -e "${YELLOW}Please run: gh auth login${NC}"
    exit 1
fi

echo -e "${GREEN}✅ GitHub CLI is authenticated${NC}"

# Read and parse .env file
echo -e "${BLUE}📖 Reading $ENV_FILE...${NC}"

# Create temporary file to store parsed variables
TEMP_FILE=$(mktemp)
trap "rm -f $TEMP_FILE" EXIT

# Parse .env file and extract valid KEY=VALUE pairs
while IFS= read -r line || [[ -n "$line" ]]; do
    # Remove leading/trailing whitespace
    line=$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    
    # Skip empty lines and comments
    if [[ -z "$line" || "$line" =~ ^# ]]; then
        continue
    fi
    
    # Check if line contains =
    if [[ "$line" =~ ^([^=]+)=(.*)$ ]]; then
        key="${BASH_REMATCH[1]}"
        value="${BASH_REMATCH[2]}"
        
        # Remove quotes from value if present
        value=$(echo "$value" | sed 's/^["'\'']\|["'\'']$//g')
        
        # Store in temp file
        echo "$key=$value" >> "$TEMP_FILE"
    else
        echo -e "${YELLOW}⚠️  Warning: Skipping invalid line: $line${NC}"
    fi
done < "$ENV_FILE"

# Count variables
VAR_COUNT=$(wc -l < "$TEMP_FILE" | tr -d ' ')
echo -e "${BLUE}📝 Found $VAR_COUNT environment variables${NC}"

if [[ $VAR_COUNT -eq 0 ]]; then
    echo -e "${BLUE}ℹ️  No environment variables found to upload${NC}"
    exit 0
fi

# Display variables that will be uploaded
echo -e "\n${BLUE}📋 Environment variables to upload:${NC}"
while IFS='=' read -r key value; do
    # Mask the value for display
    if [[ ${#value} -gt 10 ]]; then
        masked_value="${value:0:4}$(printf '*%.0s' $(seq 1 $((${#value} - 8))))${value: -4}"
    else
        masked_value=$(printf '*%.0s' $(seq 1 ${#value}))
    fi
    echo -e "  ${GREEN}$key${NC}=$masked_value"
done < "$TEMP_FILE"

if [[ "$DRY_RUN" == "true" ]]; then
    echo -e "\n${YELLOW}🔍 Dry run mode - no secrets will be uploaded${NC}"
    exit 0
fi

echo -e "\n${YELLOW}⚠️  This will upload the above environment variables as GitHub repository secrets.${NC}"
echo -e "${YELLOW}⚠️  Existing secrets with the same names will be overwritten.${NC}"

# Confirm before uploading (uncomment for interactive mode)
# read -p "Do you want to continue? (y/N): " -n 1 -r
# echo
# if [[ ! $REPLY =~ ^[Yy]$ ]]; then
#     echo "Aborted."
#     exit 0
# fi

echo -e "\n${BLUE}🚀 Uploading secrets to GitHub...${NC}"

SUCCESS_COUNT=0
ERROR_COUNT=0

# Upload each environment variable as a secret
while IFS='=' read -r key value; do
    echo -e "${BLUE}📤 Uploading $key...${NC}"
    
    if gh secret set "$key" --body "$value" 2>/dev/null; then
        echo -e "${GREEN}✅ Successfully uploaded $key${NC}"
        ((SUCCESS_COUNT++))
    else
        echo -e "${RED}❌ Failed to upload $key${NC}"
        ((ERROR_COUNT++))
    fi
done < "$TEMP_FILE"

# Summary
echo -e "\n${BLUE}📊 Upload Summary:${NC}"
echo -e "${GREEN}✅ Successfully uploaded: $SUCCESS_COUNT secrets${NC}"
if [[ $ERROR_COUNT -gt 0 ]]; then
    echo -e "${RED}❌ Failed to upload: $ERROR_COUNT secrets${NC}"
fi

if [[ $SUCCESS_COUNT -gt 0 ]]; then
    echo -e "\n${GREEN}🎉 Environment variables have been uploaded to GitHub secrets!${NC}"
    echo -e "${BLUE}🔗 You can view them at: https://github.com/OWNER/REPO/settings/secrets/actions${NC}"
    echo -e "${YELLOW}   (Replace OWNER/REPO with your actual repository)${NC}"
fi

if [[ $ERROR_COUNT -gt 0 ]]; then
    exit 1
fi
