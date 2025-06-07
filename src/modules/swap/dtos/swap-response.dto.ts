import { DexHunterEsitmateSwapResponse } from 'external/dexhunter/types';

export interface EstimateSwapResponse extends DexHunterEsitmateSwapResponse {
  estimated_point: string;
}
