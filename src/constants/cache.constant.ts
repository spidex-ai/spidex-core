const MILLISECONDS_PER_MINUTE = 60 * 1000;

export const TOP_MCAP_TOKENS_CACHE_KEY = (limit: number, page: number) => `top_mcap_tokens_${limit}_${page}`;
export const TOP_MCAP_TOKENS_CACHE_TTL = 10 * MILLISECONDS_PER_MINUTE;

export const TOP_VOLUME_TOKENS_CACHE_KEY = (timeFrame: string, limit: number, page: number) =>
  `top_volume_tokens_${timeFrame}_${limit}_${page}`;
export const TOP_VOLUME_TOKENS_CACHE_TTL = 10 * MILLISECONDS_PER_MINUTE;

export const TOKEN_PRICE_IN_USD_CACHE_KEY = (unit: string) => `token_price_in_usd_${unit}`;
export const TOKEN_PRICE_IN_USD_CACHE_TTL = 10 * MILLISECONDS_PER_MINUTE;

export const TOKEN_STATS_CACHE_KEY = (tokenId: string) => `token_stats_${tokenId}`;
export const TOKEN_STATS_CACHE_TTL = 10 * MILLISECONDS_PER_MINUTE;

export const TOKEN_DETAILS_CACHE_KEY = (tokenId: string) => `token_details_${tokenId}`;
export const TOKEN_DETAILS_CACHE_TTL = 10 * MILLISECONDS_PER_MINUTE;

export const TOP_HOLDERS_CACHE_KEY = (tokenId: string, limit: number, page: number) =>
  `top_holders_${tokenId}_${limit}_${page}`;
export const TOP_HOLDERS_CACHE_TTL = 5 * MILLISECONDS_PER_MINUTE;

export const TOKEN_TRADES_CACHE_KEY = (tokenId: string, timeFrame: string, limit: number, page: number) =>
  `token_trades_${tokenId}_${timeFrame}_${limit}_${page}`;
export const TOKEN_TRADES_CACHE_TTL = 0.5 * MILLISECONDS_PER_MINUTE;

export const TOKEN_METADATA_CACHE_KEY = (tokenId: string) => `token_metadata_${tokenId}`;
export const TOKEN_METADATA_CACHE_TTL = 20 * MILLISECONDS_PER_MINUTE;

export const TOKEN_OHLCV_CACHE_KEY = (tokenId: string, interval: string, numIntervals: number) =>
  `token_ohlcv_${tokenId}_${interval}_${numIntervals}`;
export const TOKEN_OHLCV_CACHE_TTL = 3 * MILLISECONDS_PER_MINUTE;

export const ADA_OHLCV_CACHE_KEY = (interval: string, numIntervals: number) => `ada_ohlcv_${interval}_${numIntervals}`;
export const ADA_OHLCV_CACHE_TTL = 3 * MILLISECONDS_PER_MINUTE;

export const ADA_INFO_CACHE_KEY = () => `ada_info`;
export const ADA_INFO_CACHE_TTL = 10 * MILLISECONDS_PER_MINUTE;

export const TOKEN_HOLDER_COUNT_CACHE_KEY = (tokenId: string) => `token_holder_count_${tokenId}`;
export const TOKEN_HOLDER_COUNT_CACHE_TTL = 10 * MILLISECONDS_PER_MINUTE;
