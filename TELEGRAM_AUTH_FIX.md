# Telegram Authentication Issue Analysis & Fix

## 🔍 **Issue Analysis**

Your Telegram OAuth payload looks correct:
```json
{
  "id": 5071214045,
  "first_name": "David",
  "username": "dazidz", 
  "photo_url": "https://t.me/i/userpic/320/...",
  "auth_date": 1749200654,
  "hash": "eb936e98fd2ba78a6223cf437756e3887b7e42b2e9a1d4ca456412603beade91",
  "referralCode": "demo-referral"
}
```

## 🎯 **Root Cause Found**

The main issue is **missing Telegram bot configuration** in your production environment (`.env.docker`).

The service is throwing `EError.TELEGRAM_CONFIG_MISSING` because `TELEGRAM_BOT_TOKEN` is not configured.

## ✅ **Fixes Applied**

### 1. **Added Missing Environment Variables**
Added to `.env.docker`:
```bash
# Telegram Bot configurations
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_BOT_USERNAME=your_bot_username
TELEGRAM_CHANNEL_ID=@your_channel_username_or_chat_id

# Telegram OAuth configurations  
TELEGRAM_AUTH_MAX_AGE=86400
TELEGRAM_REQUIRE_CHANNEL_MEMBERSHIP=false
```

### 2. **Improved Hash Verification**
Fixed the hash verification to properly filter out non-Telegram fields like `referralCode`:

```typescript
// Only include official Telegram fields in hash verification
const telegramFields = ['id', 'first_name', 'last_name', 'username', 'photo_url', 'auth_date'];
```

### 3. **Added Debug Logging**
Enhanced logging to help troubleshoot future issues:
- Auth data validation
- Time difference checks  
- Hash calculation details

## 🔧 **Required Actions**

### 1. **Configure Your Telegram Bot**
Replace the placeholder values in `.env.docker` with your actual bot credentials:

```bash
# Get these from @BotFather on Telegram
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_BOT_USERNAME=your_actual_bot_username

# Optional: For channel membership verification
TELEGRAM_CHANNEL_ID=@your_channel_or_chat_id
```

### 2. **How to Get Telegram Bot Token**
1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Use `/newbot` command to create a new bot (or `/mybots` for existing)
3. Follow the prompts to set bot name and username
4. Copy the bot token provided
5. Get the bot username (without @)

### 3. **Test the Debug Script**
Use the provided `debug-telegram-auth.js` script:

```bash
# Edit the script with your bot token
node debug-telegram-auth.js
```

This will help verify if your hash calculation is correct.

## 🧪 **Testing Your Fix**

### 1. **Deploy with New Configuration**
```bash
# Update your .env.docker with real bot credentials
# Then redeploy
docker compose up -d --build
```

### 2. **Test the Endpoint**
```bash
curl -X POST http://localhost:8000/api/auth/connect/telegram \
  -H "Content-Type: application/json" \
  -d '{
    "id": 5071214045,
    "first_name": "David",
    "username": "dazidz",
    "photo_url": "https://t.me/i/userpic/320/...",
    "auth_date": 1749200654,
    "hash": "eb936e98fd2ba78a6223cf437756e3887b7e42b2e9a1d4ca456412603beade91",
    "referralCode": "demo-referral"
  }'
```

### 3. **Check Logs**
Monitor the application logs for debug information:
```bash
docker compose logs -f api
```

Look for:
- ✅ `Telegram auth verification successful`
- ❌ `Telegram bot token not configured`
- ❌ `Telegram hash verification failed`

## 🚨 **Common Issues & Solutions**

### Issue: "Telegram bot token not configured"
**Solution**: Add `TELEGRAM_BOT_TOKEN` to your environment file

### Issue: "Invalid Telegram authentication data" 
**Solution**: 
1. Verify bot token is correct
2. Check if auth_date is not too old (default: 24 hours)
3. Ensure hash was generated with the same bot token

### Issue: Hash verification fails
**Solution**:
1. Use the debug script to verify hash calculation
2. Ensure no extra fields are included in hash calculation
3. Verify bot token matches the one used to generate the hash

## 📝 **Next Steps**

1. **Configure bot credentials** in `.env.docker`
2. **Redeploy** your application
3. **Test** with your payload
4. **Monitor logs** for any remaining issues

The authentication should work correctly once you provide the actual Telegram bot token!
