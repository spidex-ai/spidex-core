export interface DexHunterSearchTokenInfo {
    token_id: string
    token_decimals: number
    token_policy: string
    token_ascii: string
    ticker: string
    is_verified: boolean
    supply: number
    creation_date: string
    price: number
    logo?: string
    unit?: string
}


export interface DexHunterTokenDetail {
    token_id: string
    token_decimals: number
    token_policy: string
    token_ascii: string
    ticker: string
    is_verified: boolean
    supply: number
    creation_date: string
    price: number
}

/**
 * Interface for swap transaction payload
 */

export interface EsitmateSwapPayload {
    token_in: string;
    token_out: string;
    slippage: number;
    amount_in: number;
    blacklisted_dexes: string[];
}
export interface SwapPayload {
    buyer_address: string;
    token_in: string;
    token_out: string;
    slippage: number;
    amount_in: number;
    tx_optimization: boolean;
    blacklisted_dexes: string[];
}


export interface BuildSwapResponse {
    cbor: string
    splits: Split[]
    average_price: number
    total_fee: number
    total_output: number
    deposits: number
    total_output_without_slippage: number
    possible_routes: PossibleRoutes
    dexhunter_fee: number
    batcher_fee: number
    total_input: number
    total_input_without_slippage: number
    net_price: number
    net_price_reverse: number
    partner_fee: number
    communications: any[]
    partner_code: string
}

export interface Split {
    amount_in: number
    expected_output: number
    expected_output_without_slippage: number
    fee: number
    dex: string
    price_impact: number
    initial_price: number
    final_price: number
    pool_id: string
    batcher_fee: number
    deposits: number
    price_distortion: number
    pool_fee: number
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface PossibleRoutes { }

export interface SubmitSwapPayload {
    txCbor: string
    signatures: string
}
export interface SubmitSwapResponse {
    cbor: string
    strat_id: string
}
export interface DexHunterEsitmateSwapResponse {
    splits: Split[]
    average_price: number
    total_fee: number
    total_output: number
    deposits: number
    total_output_without_slippage: number
    possible_routes: PossibleRoutes
    dexhunter_fee: number
    batcher_fee: number
    net_price: number
    net_price_reverse: number
    partner_fee: number
    communications: any[]
    partner_code: string
}

export interface PoolStatsResponse {
    dex_name: string
    token_1_amount: number
    token_2_amount: number
}

export interface SwapWalletPayload {
    addresses: string[]
}

