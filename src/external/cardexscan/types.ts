export interface CardexscanToken {
  policyId: string;
  nameHex: string;
  ticker: string;
}

export interface CardexscanEstimateSwapPayload {
  tokenInAmount: number;
  slippage: number;
  tokenIn: CardexscanToken | string;
  tokenOut: CardexscanToken | string;
  blacklisted_dexes: string[];
}

export interface CardexscanSplit {
  estimatedAmount: string;
  dex: string;
  minimumAmount: number;
  priceImpact: number;
  splitPercent: number;
  amountIn: number;
  deposits: number;
  batcherFee: number;
}

export interface CardexscanEstimateSwapResponse {
  data: {
    splits: CardexscanSplit[];
    estimatedTotalRecieve: number;
  };
  error: any;
}

export interface CardexscanBuildSwapPayload {
  tokenInAmount: number;
  slippage: number;
  tokenIn: CardexscanToken | string;
  tokenOut: CardexscanToken | string;
  blacklisted_dexes: string[];
  userAddress: string;
}

export interface CardexscanBuildSwapResponse {
  data: {
    txCbor: string;
  };
  error: any;
}

export interface CardexscanSubmitSwapPayload {
  txCbor: string;
  witnesses?: string;
}

export interface CardexscanSubmitSwapResponse {
  data: {
    txHash: string;
    success: boolean;
  };
  error: any;
}
