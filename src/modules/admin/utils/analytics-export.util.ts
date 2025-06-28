import {
  DailyActiveUsersResponse,
  TopVolumeUser,
  TopSilkPointUser,
  TopReferralUser,
} from '../interfaces/admin-analytics.interface';

export class AnalyticsExportUtil {
  /**
   * Convert daily active users data to CSV format
   */
  static dailyActiveUsersToCSV(data: DailyActiveUsersResponse): string {
    const headers = ['Date', 'Active Users Count'];
    const rows = [[data.date, data.activeUsers.toString()]];

    if (data.details && data.details.length > 0) {
      // Add detailed user activity data
      const detailHeaders = ['User ID', 'Username', 'Last Activity', 'Activity Type'];
      const detailRows = data.details.map(detail => [
        detail.userId.toString(),
        detail.username || 'N/A',
        detail.lastActivity.toISOString(),
        detail.activityType,
      ]);

      return [
        'Summary',
        headers.join(','),
        ...rows.map(row => row.join(',')),
        '',
        'User Details',
        detailHeaders.join(','),
        ...detailRows.map(row => row.join(',')),
      ].join('\n');
    }

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  /**
   * Convert top volume users data to CSV format
   */
  static topVolumeUsersToCSV(data: TopVolumeUser[]): string {
    const headers = ['User ID', 'Username', 'Total Volume', 'Transaction Count'];
    const rows = data.map(user => [
      user.userId.toString(),
      user.username || 'N/A',
      user.totalVolume.toString(),
      user.transactionCount.toString(),
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  /**
   * Convert top silk point users data to CSV format
   */
  static topSilkPointUsersToCSV(data: TopSilkPointUser[]): string {
    const headers = ['User ID', 'Username', 'Silk Points', 'Points Earned'];
    const rows = data.map(user => [
      user.userId.toString(),
      user.username || 'N/A',
      user.silkPoints.toString(),
      user.pointsEarned?.toString() || '0',
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  /**
   * Convert top referral users data to CSV format
   */
  static topReferralUsersToCSV(data: TopReferralUser[]): string {
    const headers = ['User ID', 'Username', 'Referral Count', 'Referral Rewards'];
    const rows = data.map(user => [
      user.userId.toString(),
      user.username || 'N/A',
      user.referralCount.toString(),
      user.referralRewards?.toString() || '0',
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  /**
   * Convert daily active users data to JSON format
   */
  static dailyActiveUsersToJSON(data: DailyActiveUsersResponse): string {
    return JSON.stringify(data, null, 2);
  }

  /**
   * Convert top volume users data to JSON format
   */
  static topVolumeUsersToJSON(data: TopVolumeUser[]): string {
    return JSON.stringify(data, null, 2);
  }

  /**
   * Convert top silk point users data to JSON format
   */
  static topSilkPointUsersToJSON(data: TopSilkPointUser[]): string {
    return JSON.stringify(data, null, 2);
  }

  /**
   * Convert top referral users data to JSON format
   */
  static topReferralUsersToJSON(data: TopReferralUser[]): string {
    return JSON.stringify(data, null, 2);
  }

  /**
   * Generate filename with timestamp
   */
  static generateFilename(type: string, format: 'csv' | 'json'): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `admin_analytics_${type}_${timestamp}.${format}`;
  }

  /**
   * Get appropriate content type for format
   */
  static getContentType(format: 'csv' | 'json'): string {
    return format === 'csv' ? 'text/csv' : 'application/json';
  }

  /**
   * Sanitize data for privacy compliance
   * Removes or masks sensitive user information
   */
  static sanitizeForPrivacy<T extends { username?: string }>(data: T[]): T[] {
    return data.map(item => ({
      ...item,
      username: item.username ? this.maskUsername(item.username) : 'N/A',
    }));
  }

  /**
   * Mask username for privacy (show first 2 and last 2 characters)
   */
  private static maskUsername(username: string): string {
    if (username.length <= 4) {
      return '*'.repeat(username.length);
    }
    const start = username.substring(0, 2);
    const end = username.substring(username.length - 2);
    const middle = '*'.repeat(username.length - 4);
    return `${start}${middle}${end}`;
  }
}
