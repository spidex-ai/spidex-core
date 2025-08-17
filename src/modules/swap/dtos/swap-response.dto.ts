export enum ProtocolEnum {
  SUNDAESWAPV3 = 'SundaeSwapV3',
  SPLASH = 'SPLASH',
  SPLASHTABLE = 'SPLASHTABLE',
  MINSWAPV2 = 'MINSWAPV2',
  MINSWAP = 'MINSWAP',
  MINSWAPSTABLE = 'MINSWAPSTABLE',
  WINGRIDER = 'WINGRIDER',
  WINGRIDERV2 = 'WINGRIDERV2',
  WINGRIDERSTABLEV2 = 'WINGRIDERSTABLEV2',
  SNEKFUN = 'SNEKFUN',
  SPECTRUM = 'SPECTRUM',
  SUNDAESWAP = 'SUNDAESWAP',
  VYFI = 'VYFI',
  CSWAP = 'CSWAP',
  MUESLISWAP = 'MUESLISWAP',
  CERRA = 'CERRA',
  GENIUS = 'GENIUS',
}

export enum DexHunterProtocolEnum {
  SUNDAESWAPV3 = 'SUNDAESWAPV3',
  SPLASH = 'SPLASH',
  MINSWAPV2 = 'MINSWAPV2',
  MINSWAP = 'MINSWAP',
  WINGRIDER = 'WINGRIDER',
  WINGRIDERV2 = 'WINGRIDERV2',
  SNEKFUN = 'SNEKFUN',
  SPECTRUM = 'SPECTRUM',
  SUNDAESWAP = 'SUNDAESWAP',
  VYFI = 'VYFI',
  CSWAP = 'CSWAP',
  MUESLISWAP = 'MUESLISWAP',
  CERRA = 'CERRA',
  GENIUS = 'GENIUS',
}

export enum MinswapProtocolEnum {
  SUNDAESWAPV3 = 'SundaeSwapV3',
  SPLASH = 'Splash',
  SPLASHTABLE = 'SplashStable',
  MINSWAPV2 = 'MinswapV2',
  MINSWAP = 'Minswap',
  MINSWAPSTABLE = 'MinswapStable',
  WINGRIDER = 'WingRiders',
  WINGRIDERV2 = 'WingRidersV2',
  WINGRIDERSTABLEV2 = 'WingRidersStableV2',
  SPECTRUM = 'Spectrum',
  SUNDAESWAP = 'SundaeSwap',
  VYFI = 'VyFinance',
  MUESLISWAP = 'MuesliSwap',
}

export const dexhunterProtocolMap: Record<DexHunterProtocolEnum, ProtocolEnum> = {
  [DexHunterProtocolEnum.SUNDAESWAPV3]: ProtocolEnum.SUNDAESWAPV3,
  [DexHunterProtocolEnum.SPLASH]: ProtocolEnum.SPLASH,
  [DexHunterProtocolEnum.MINSWAPV2]: ProtocolEnum.MINSWAPV2,
  [DexHunterProtocolEnum.MINSWAP]: ProtocolEnum.MINSWAP,
  [DexHunterProtocolEnum.WINGRIDER]: ProtocolEnum.WINGRIDER,
  [DexHunterProtocolEnum.WINGRIDERV2]: ProtocolEnum.WINGRIDERV2,
  [DexHunterProtocolEnum.SNEKFUN]: ProtocolEnum.SNEKFUN,
  [DexHunterProtocolEnum.SPECTRUM]: ProtocolEnum.SPECTRUM,
  [DexHunterProtocolEnum.SUNDAESWAP]: ProtocolEnum.SUNDAESWAP,
  [DexHunterProtocolEnum.VYFI]: ProtocolEnum.VYFI,
  [DexHunterProtocolEnum.CSWAP]: ProtocolEnum.CSWAP,
  [DexHunterProtocolEnum.MUESLISWAP]: ProtocolEnum.MUESLISWAP,
  [DexHunterProtocolEnum.CERRA]: ProtocolEnum.CERRA,
  [DexHunterProtocolEnum.GENIUS]: ProtocolEnum.GENIUS,
};

export const minswapProtocolMap: Record<MinswapProtocolEnum, ProtocolEnum> = {
  [MinswapProtocolEnum.SUNDAESWAPV3]: ProtocolEnum.SUNDAESWAPV3,
  [MinswapProtocolEnum.SPLASH]: ProtocolEnum.SPLASH,
  [MinswapProtocolEnum.SPLASHTABLE]: ProtocolEnum.SPLASHTABLE,
  [MinswapProtocolEnum.MINSWAPV2]: ProtocolEnum.MINSWAPV2,
  [MinswapProtocolEnum.MINSWAP]: ProtocolEnum.MINSWAP,
  [MinswapProtocolEnum.MINSWAPSTABLE]: ProtocolEnum.MINSWAPSTABLE,
  [MinswapProtocolEnum.WINGRIDER]: ProtocolEnum.WINGRIDER,
  [MinswapProtocolEnum.WINGRIDERV2]: ProtocolEnum.WINGRIDERV2,
  [MinswapProtocolEnum.WINGRIDERSTABLEV2]: ProtocolEnum.WINGRIDERSTABLEV2,
  [MinswapProtocolEnum.SPECTRUM]: ProtocolEnum.SPECTRUM,
  [MinswapProtocolEnum.SUNDAESWAP]: ProtocolEnum.SUNDAESWAP,
  [MinswapProtocolEnum.VYFI]: ProtocolEnum.VYFI,
  [MinswapProtocolEnum.MUESLISWAP]: ProtocolEnum.MUESLISWAP,
};

export interface EstimateSwapResponse {
  dexhunter: AggregatorEstimateSwapResponse;
  minswap: AggregatorEstimateSwapResponse;
  estimatedPoint: string;
}

export interface AggregatorEstimateSwapResponse {
  netPrice: string;
  minReceive: string;
  dexFee: string;
  dexDeposits: string;
  totalDeposits: string;
  paths: AggregatorPathResponse[];
}

export interface AggregatorPathResponse {
  protocol: ProtocolEnum;
  poolId: string;
  amountIn: string;
  amountOut: string;
  minReceive: string;
  priceImpact: number;
  batcherFee: string;
  refundableDeposits: string;
}
