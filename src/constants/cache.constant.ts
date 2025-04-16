const MILLISECONDS_PER_MINUTE = 60 * 1000;

export const TOP_MCAP_TOKENS_CACHE_KEY = (limit: number, page: number) => `top_mcap_tokens_${limit}_${page}`;
export const TOP_MCAP_TOKENS_CACHE_TTL = 10 * MILLISECONDS_PER_MINUTE;

export const TOP_VOLUME_TOKENS_CACHE_KEY = (timeFrame: string, limit: number, page: number) => `top_volume_tokens_${timeFrame}_${limit}_${page}`;
export const TOP_VOLUME_TOKENS_CACHE_TTL = 10 * MILLISECONDS_PER_MINUTE;

export const TOKEN_PRICE_IN_USD_CACHE_KEY = (unit: string) => `token_price_in_usd_${unit}`;
export const TOKEN_PRICE_IN_USD_CACHE_TTL = 10 * MILLISECONDS_PER_MINUTE;

export const TOKEN_STATS_CACHE_KEY = (tokenId: string) => `token_stats_${tokenId}`;
export const TOKEN_STATS_CACHE_TTL = 10 * MILLISECONDS_PER_MINUTE;

export const TOKEN_DETAILS_CACHE_KEY = (tokenId: string) => `token_details_${tokenId}`;
export const TOKEN_DETAILS_CACHE_TTL = 10 * MILLISECONDS_PER_MINUTE;
