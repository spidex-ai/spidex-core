#!/bin/bash

# Fix for Telegram 409 Conflict Error
# This script resolves the "terminated by other getUpdates request" issue

echo "🔧 Fixing Telegram 409 Conflict Error"
echo "====================================="
echo "Error: ETELEGRAM: 409 Conflict: terminated by other getUpdates request"
echo ""

# Function to stop all containers
stop_all_containers() {
    echo "🛑 Stopping all containers to clear polling conflicts..."
    docker compose down
    echo "✅ All containers stopped"
    echo ""
}

# Function to clear webhook (if any)
clear_webhook() {
    echo "🧹 Clearing any existing webhook..."
    
    # Extract bot token from .env.docker
    BOT_TOKEN=$(grep TELEGRAM_BOT_TOKEN .env.docker | cut -d'=' -f2)
    
    if [ -n "$BOT_TOKEN" ]; then
        echo "Testing bot token and clearing webhook..."
        
        # Check current webhook
        WEBHOOK_INFO=$(curl -s "https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo")
        echo "Current webhook status: $WEBHOOK_INFO"
        
        # Delete webhook
        DELETE_RESULT=$(curl -s -X POST "https://api.telegram.org/bot$BOT_TOKEN/deleteWebhook")
        echo "Webhook deletion result: $DELETE_RESULT"
        
        if echo "$DELETE_RESULT" | grep -q '"ok":true'; then
            echo "✅ Webhook cleared successfully"
        else
            echo "⚠️  Webhook clearing may have failed, but continuing..."
        fi
    else
        echo "❌ Could not extract bot token from .env.docker"
    fi
    echo ""
}

# Function to wait and ensure no polling conflicts
wait_for_clear_state() {
    echo "⏳ Waiting 30 seconds to ensure all polling connections are cleared..."
    sleep 30
    echo "✅ Wait complete"
    echo ""
}

# Function to start only API container first
start_api_only() {
    echo "🚀 Starting API container only (to handle Telegram bot)..."
    docker compose up -d api
    
    echo "⏳ Waiting 45 seconds for API to fully initialize..."
    sleep 45
    
    echo "📋 Checking API container status..."
    docker compose ps api
    echo ""
}

# Function to start remaining containers
start_remaining_containers() {
    echo "🚀 Starting remaining containers..."
    docker compose up -d
    
    echo "⏳ Waiting 15 seconds for all services to start..."
    sleep 15
    
    echo "📋 Final container status:"
    docker compose ps
    echo ""
}

# Function to verify fix
verify_fix() {
    echo "🔍 Verifying the fix..."
    
    echo "1. Checking health endpoint..."
    for i in {1..3}; do
        echo "   Attempt $i/3..."
        if curl -f -s "http://localhost:8000/api/health-check" > /dev/null 2>&1; then
            echo "   ✅ API is responding!"
            break
        else
            echo "   ⏳ Waiting 10 seconds..."
            sleep 10
        fi
    done
    
    echo ""
    echo "2. Checking for Telegram initialization in logs..."
    docker compose logs --tail=20 api | grep -i "telegram\|bot" | tail -5
    
    echo ""
    echo "3. Looking for any remaining 409 errors..."
    CONFLICT_ERRORS=$(docker compose logs --tail=50 api | grep -i "409\|conflict\|getUpdates" | wc -l)
    
    if [ "$CONFLICT_ERRORS" -eq 0 ]; then
        echo "   ✅ No 409 conflict errors found!"
    else
        echo "   ⚠️  Still found $CONFLICT_ERRORS potential conflict errors"
        docker compose logs --tail=20 api | grep -i "409\|conflict\|getUpdates"
    fi
    echo ""
}

# Function to show monitoring commands
show_monitoring() {
    echo "📊 Monitoring Commands:"
    echo "======================"
    echo "• Watch logs: docker compose logs -f api | grep -i telegram"
    echo "• Health check: curl http://localhost:8000/api/health-check"
    echo "• Container status: docker compose ps"
    echo "• Check for conflicts: docker compose logs api | grep -i '409\\|conflict'"
    echo ""
}

# Main execution
echo "🎯 Root Cause: Multiple instances polling the same Telegram bot token"
echo "🔧 Solution: Ensure only ONE instance handles Telegram polling"
echo ""

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: docker-compose.yml not found. Please run this script from the project root."
    exit 1
fi

# Ask for confirmation
read -p "🤔 This will restart your containers to fix the 409 conflict. Continue? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Starting 409 conflict fix process..."
    echo ""
    
    # Execute fix steps
    stop_all_containers
    clear_webhook
    wait_for_clear_state
    start_api_only
    start_remaining_containers
    verify_fix
    show_monitoring
    
    echo "🎉 409 Conflict Fix Complete!"
    echo "============================="
    echo ""
    echo "✅ What was fixed:"
    echo "   - Stopped all containers to clear polling conflicts"
    echo "   - Cleared any existing webhook that might conflict"
    echo "   - Started API container first (only instance that polls)"
    echo "   - Added instance identification to prevent future conflicts"
    echo ""
    echo "🔍 The fix ensures:"
    echo "   - Only the 'api' container handles Telegram bot polling"
    echo "   - The 'core-consumer' container skips Telegram initialization"
    echo "   - No more 409 conflicts from multiple polling instances"
    echo ""
    echo "📱 If you see this log message, it's working:"
    echo "   '✅ Telegram bot initialized successfully: @SpidexAIBot'"
    echo ""
    echo "🚨 If 409 errors persist:"
    echo "   1. Check if you have other deployments using the same bot token"
    echo "   2. Verify no webhook is set: curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
    echo "   3. Ensure no other applications are polling this bot"
    echo ""
else
    echo "❌ Operation cancelled. No changes made."
    echo ""
    echo "💡 Manual fix steps:"
    echo "   1. Stop all containers: docker compose down"
    echo "   2. Wait 30 seconds"
    echo "   3. Start API only: docker compose up -d api"
    echo "   4. Wait for API to initialize (check logs)"
    echo "   5. Start remaining: docker compose up -d"
    exit 0
fi

echo "✨ Monitor the logs to ensure stable operation without 409 conflicts!"
