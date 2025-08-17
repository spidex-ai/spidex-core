export interface DexHunterSearchTokenInfo {
  token_id: string;
  token_decimals: number;
  token_policy: string;
  token_ascii: string;
  ticker: string;
  is_verified: boolean;
  supply: number;
  creation_date: string;
  price: number;
  logo?: string;
  unit?: string;
}

export interface DexHunterTokenDetail {
  token_id: string;
  token_decimals: number;
  token_policy: string;
  token_ascii: string;
  ticker: string;
  is_verified: boolean;
  supply: number;
  creation_date: string;
  price: number;
}

/**
 * Interface for swap transaction payload
 */

export interface EsitmateSwapPayload {
  amount: string;
  token_in: string;
  token_out: string;
  slippage: number;
  exclude_protocols?: string[];
  allow_multi_hops: boolean;
  partner?: string;
}

export interface SwapPayload {
  sender: string;
  min_amount_out: string;
  estimate: {
    amount: string;
    token_in: string;
    token_out: string;
    slippage: number;
    exclude_protocols: string[];
    allow_multi_hops: boolean;
    partner?: string;
  };
}

export interface BuildSwapResponse {
  cbor: string;
  splits: Split[];
  average_price: number;
  total_fee: number;
  total_output: number;
  deposits: number;
  total_output_without_slippage: number;
  possible_routes: PossibleRoutes;
  dexhunter_fee: number;
  batcher_fee: number;
  total_input: number;
  total_input_without_slippage: number;
  net_price: number;
  net_price_reverse: number;
  partner_fee: number;
  communications: any[];
  partner_code: string;
}

export interface Split {
  amount_in: number;
  expected_output: number;
  expected_output_without_slippage: number;
  fee: number;
  dex: string;
  price_impact: number;
  initial_price: number;
  final_price: number;
  pool_id: string;
  batcher_fee: number;
  deposits: number;
  price_distortion: number;
  pool_fee: number;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface PossibleRoutes {}

export interface MinswapSubmitSwapPayload {
  cbor: string;
  witness_set: string;
}
export interface MinswapSubmitSwapResponse {
  cbor: string;
  strat_id: string;
}
export interface MinswapEsitmateSwapResponse {
  token_in: string;
  token_out: string;
  amount_in: string;
  amount_out: string;
  min_amount_out: string;
  total_lp_fee: string;
  total_dex_fee: string;
  deposits: string;
  avg_price_impact: number;
  paths: MinswapEstimateSwapPath[][];
  aggregator_fee: string;
  aggregator_fee_percent: number;
}

export interface MinswapEstimateSwapPath {
  pool_id: string;
  protocol: string;
  lp_token: string;
  token_in: string;
  token_out: string;
  amount_in: string;
  amount_out: string;
  min_amount_out: string;
  lp_fee: string;
  dex_fee: string;
  deposits: string;
  price_impact: number;
}

export interface PoolStatsResponse {
  dex_name: string;
  token_1_amount: number;
  token_2_amount: number;
}

export interface SwapWalletPayload {
  addresses: string[];
}

export interface MinswapAggregatorSearchRequest {
  query: string;
  only_verified: boolean;
  assets?: string[];
  search_after?: string[];
}

export interface MinswapAggregatorTokenInfo {
  token_id: string;
  logo?: string;
  ticker: string;
  is_verified: boolean;
  price_by_ada: number;
  project_name: string;
  decimals: number;
}

export interface MinswapAggregatorSearchResponse {
  tokens: MinswapAggregatorTokenInfo[];
  search_after: string[];
}

export interface MinswapAdaPriceResponse {
  currency: string;
  value: {
    change_24h: number;
    price: number;
  };
}
