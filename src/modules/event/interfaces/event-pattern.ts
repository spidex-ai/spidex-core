export const EVENT_PATTERNS = {
  TRADE_COMPLETED_FOR_EVENT: 'event.trade.completed',
  EVENT_LEADERBOARD_UPDATE: 'event.leaderboard.update',
  EVENT_PRIZE_DISTRIBUTION: 'event.prize.distribution',
  EVENT_STATUS_CHANGED: 'event.status.changed',
  LEADERBOARD_RANK_CHANGED: 'event.leaderboard.rank.changed',
  EVENT_RELATED_TRADE: 'event.related.trade',
  DEAD_LETTER: {
    EVENT_RELATED_TRADE: 'event.dead-letter.related.trade',
    EVENT_STATUS_CHANGED: 'event.dead-letter.status.changed',
  },
} as const;
