# Admin Analytics Service

A comprehensive analytics service for tracking user activity, trading volume, silk points, and referrals with Redis caching and data export capabilities.

## Features

### 📊 Analytics Tracking
- **Daily Active Users**: Track unique users who performed any action within specified time periods
- **Top Volume Users**: Track users with highest trading/transaction volume
- **Top Silk Point Users**: Track users with highest silk point balances or earnings
- **Top Referral Users**: Track users with most successful referrals

### ⚡ Performance Optimizations
- **Redis Caching**: All analytics data is cached with appropriate TTL (5-15 minutes)
- **Rate Limiting**: 30 requests per minute per admin per endpoint
- **Efficient Queries**: Optimized database queries with proper indexing
- **Error Handling**: Comprehensive error handling and logging

### 🔒 Security & Privacy
- **Admin Authentication**: All endpoints require admin authentication
- **Rate Limiting**: Prevents abuse with Redis-based rate limiting
- **Privacy Compliance**: Optional data sanitization for user information
- **Audit Logging**: Comprehensive logging for audit trails

### 📤 Data Export
- **Multiple Formats**: Export data in CSV or JSON format
- **Privacy Options**: Optional username masking for privacy compliance
- **Automatic Filenames**: Timestamped filenames for easy organization

## API Endpoints

### Analytics Endpoints

#### Get Daily Active Users
```
GET /admin/analytics/daily-active-users
```

**Query Parameters:**
- `date` (optional): Date in YYYY-MM-DD format (default: current date)
- `timeRange` (optional): Time range for analysis (`1d`, `7d`, `30d`)
- `includeDetails` (optional): Include detailed user activity information

**Response:**
```json
{
  "date": "2024-01-15",
  "activeUsers": 150,
  "details": [
    {
      "userId": 1,
      "username": "user1",
      "lastActivity": "2024-01-15T10:30:00Z",
      "activityType": "point_activity"
    }
  ]
}
```

#### Get Top Volume Users
```
GET /admin/analytics/top-volume-users
```

**Query Parameters:**
- `timeframe` (optional): Timeframe for analysis (`1d`, `7d`, `30d`, `all`)
- `limit` (optional): Number of top users to return (max 100, default 10)

**Response:**
```json
[
  {
    "userId": 1,
    "username": "trader1",
    "totalVolume": 50000.50,
    "transactionCount": 25
  }
]
```

#### Get Top Silk Point Users
```
GET /admin/analytics/top-silk-point-users
```

**Query Parameters:**
- `timeframe` (optional): Timeframe for analysis (`1d`, `7d`, `30d`, `all`)
- `limit` (optional): Number of top users to return (max 100, default 10)

**Response:**
```json
[
  {
    "userId": 1,
    "username": "pointmaster",
    "silkPoints": 10000.25,
    "pointsEarned": 2500.50
  }
]
```

#### Get Top Referral Users
```
GET /admin/analytics/top-referral-users
```

**Query Parameters:**
- `timeframe` (optional): Timeframe for analysis (`1d`, `7d`, `30d`, `all`)
- `limit` (optional): Number of top users to return (max 100, default 10)

**Response:**
```json
[
  {
    "userId": 1,
    "username": "referrer1",
    "referralCount": 50,
    "referralRewards": 1000.00
  }
]
```

### Export Endpoints

#### Export Daily Active Users
```
GET /admin/analytics/export/daily-active-users
```

**Query Parameters:**
- All parameters from the analytics endpoint
- `format` (optional): Export format (`csv`, `json`) - default: `json`
- `privacy` (optional): Apply privacy sanitization - default: `true`

#### Export Top Volume Users
```
GET /admin/analytics/export/top-volume-users
```

**Query Parameters:**
- All parameters from the analytics endpoint
- `format` (optional): Export format (`csv`, `json`) - default: `json`
- `privacy` (optional): Apply privacy sanitization - default: `true`

### Cache Management

#### Clear Analytics Cache
```
DELETE /admin/analytics/cache
```

**Query Parameters:**
- `type` (optional): Specific cache type to clear (e.g., `daily_active_users`)

## Caching Strategy

### Cache Keys
- Daily Active Users: `admin_analytics_daily_active_users_{date}_{timeRange}`
- Top Volume Users: `admin_analytics_top_volume_users_{timeframe}_{limit}`
- Top Silk Point Users: `admin_analytics_top_silk_point_users_{timeframe}_{limit}`
- Top Referral Users: `admin_analytics_top_referral_users_{timeframe}_{limit}`

### Cache TTL
- Daily Active Users: 10 minutes
- Top Volume Users: 15 minutes
- Top Silk Point Users: 10 minutes
- Top Referral Users: 15 minutes

## Rate Limiting

- **Limit**: 30 requests per minute per admin per endpoint
- **Implementation**: Redis-based rate limiting
- **Scope**: Per admin ID and endpoint combination
- **Reset**: 1-minute sliding window

## Privacy Compliance

### Username Masking
When privacy mode is enabled, usernames are masked:
- Usernames ≤ 4 characters: Fully masked with `*`
- Usernames > 4 characters: Show first 2 and last 2 characters with `*` in between
- Example: `username123` → `us*******23`

### Data Sanitization
- Optional privacy sanitization for all export endpoints
- Removes or masks sensitive user information
- Maintains data utility while protecting privacy

## Error Handling

### Common Error Codes
- `40000`: Bad Request
- `41001`: Rate Limit Exceeded
- `40100`: Unauthorized (Admin authentication required)

### Error Response Format
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error description",
  "validatorErrors": 40000
}
```

## Usage Examples

### Get Daily Active Users for Last 7 Days
```bash
curl -H "Authorization: Bearer {admin_token}" \
  "https://api.example.com/admin/analytics/daily-active-users?timeRange=7d&includeDetails=true"
```

### Export Top Volume Users as CSV
```bash
curl -H "Authorization: Bearer {admin_token}" \
  "https://api.example.com/admin/analytics/export/top-volume-users?format=csv&timeframe=30d&limit=50" \
  -o top_volume_users.csv
```

### Clear Specific Cache Type
```bash
curl -X DELETE -H "Authorization: Bearer {admin_token}" \
  "https://api.example.com/admin/analytics/cache?type=daily_active_users"
```

## Development

### Running Tests
```bash
npm test -- --testPathPattern=admin-analytics.service.spec.ts
```

### Adding New Analytics
1. Add new interface to `interfaces/admin-analytics.interface.ts`
2. Add new DTO to `dtos/admin-analytics.dto.ts`
3. Add cache constants to `constants/cache.constant.ts`
4. Implement service method in `AdminAnalyticsService`
5. Add controller endpoint in `AdminController`
6. Add export utility methods in `AnalyticsExportUtil`
7. Write comprehensive tests

## Performance Considerations

- Database queries are optimized with proper indexes
- Redis caching reduces database load
- Rate limiting prevents abuse
- Pagination limits prevent large data transfers
- Export functionality uses streaming for large datasets

## Security Considerations

- All endpoints require admin authentication
- Rate limiting prevents abuse
- Privacy sanitization protects user data
- Comprehensive audit logging
- Input validation and sanitization
