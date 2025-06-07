// Type definitions for Taptools API responses
export interface TokenPrice {
  [unit: string]: number;
}

export interface TokenPriceChange {
  '5m'?: number;
  '1h'?: number;
  '4h'?: number;
  '24h'?: number;
  '7d'?: number;
  '30d'?: number;
}

export interface TokenMcap {
  ticker: string;
  circSupply: number;
  totalSupply: number;
  price: number;
  mcap: number;
  fdv: number;
}

export interface TokenQuote {
  price: number;
}

export interface TokenHolders {
  holders: number;
}

export interface TokenHolder {
  address: string;
  amount: number;
}

export interface TokenPool {
  tokenA: string;
  tokenATicker: string;
  tokenB: string;
  tokenBTicker: string;
  lpTokenUnit: string;
  onchainID: string;
  tokenALocked: number;
  tokenBLocked: number;
  exchange: string;
}

export interface TokenOHLCV {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TokenTrade {
  action: string;
  address: string;
  exchange: string;
  hash: string;
  lpTokenUnit: string;
  price: number;
  time: number;
  tokenA: string;
  tokenAAmount: number;
  tokenAName: string;
  tokenB: string;
  tokenBAmount: number;
  tokenBName: string;
}

export interface TokenTradingStats {
  buyers: number;
  sellers: number;
  buyVolume: number;
  sellVolume: number;
  buys: number;
  sells: number;
}

export interface TokenLinks {
  description?: string;
  discord?: string;
  email?: string;
  facebook?: string;
  github?: string;
  instagram?: string;
  medium?: string;
  reddit?: string;
  telegram?: string;
  twitter?: string;
  website?: string;
  youtube?: string;
}

export interface TokenDetail {
  token_id?: string;
  unit: string;
  ticker: string;
  price: number;
  volume?: number;
  logo?: string;
  usdPrice?: number;
  mcap?: number;
}

export type TopToken = TokenDetail;

export interface TopTokenMcap extends TopToken {
  mcap: number;
  fdv: number;
  circSupply: number;
  totalSupply: number;
  price24hChg: number;
}

export interface TopTokenByVolume extends TopToken {
  price24hChg: number;
}

export interface TopTokenLiquidity extends TopToken {
  liquidity: number;
}

export interface NFTCollectionInfo {
  name: string;
  logo: string;
  supply: number;
  twitter?: string;
  discord?: string;
  website?: string;
  description?: string;
}

export interface NFTCollectionStats {
  volume: number;
  supply: number;
  price: number;
  owners: number;
  listings: number;
  topOffer?: number;
  sales?: number;
}

export interface NFTCollectionStatsExtended extends NFTCollectionStats {
  volumePctChg: number;
  pricePctChg: number;
  ownersPctChg: number;
  listingsPctChg: number;
  salesPctChg?: number;
}

export interface NFTAssetStats {
  timesListed: number;
  owners: number;
  sales: number;
  volume: number;
  lastSoldTime: number;
  lastSoldPrice: number;
  lastListedTime: number;
  lastListedPrice: number;
  isListed: boolean;
}

export interface NFTAssetTrait {
  category: string;
  name: string;
  rarity: number;
  price: number;
}

export interface NFTAssetTraits {
  rank: number;
  traits: NFTAssetTrait[];
}

export interface NFTCollectionTradesStats {
  volume: number;
  sales: number;
  buyers: number;
  sellers: number;
}

export interface NFTCollectionListings {
  listings: number;
  supply: number;
}

export interface NFTCollectionOHLCV {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface NFTCollectionTrade {
  name: string;
  price: number;
  market: string;
  time: number;
  image: string;
  buyerAddress: string;
  sellerAddress: string;
  policy: string;
  collectionName: string;
  hash: string;
}

export interface NFTMarketStats {
  activeAddresses: number;
  dexVolume: number;
}

export interface NFTMarketStatsExtended extends NFTMarketStats {
  volumePctChg: number;
  salesPctChg: number;
  addressesPctChg: number;
  buyersPctChg: number;
  sellersPctChg: number;
}

export interface AddressInfo {
  address: string;
  assets: AssetInfo[];
  lovelace: string;
  paymentCred: string;
  stakeAddress: string;
}

export interface AssetInfo {
  quantity: string;
  unit: string;
}

export interface AddressUtxo {
  assets: AssetInfo[];
  hash: string;
  index: number;
  lovelace: string;
}

export interface NFTAssetSale {
  buyerStakeAddress: string;
  price: number;
  sellerStakeAddress: string;
  time: number;
}

export interface NFTCollectionAsset {
  name: string;
  rank: number;
  price: number;
  image: string;
}

export interface NFTCollectionHoldersDistribution {
  '1': number;
  '2-4': number;
  '5-9': number;
  '10-24': number;
  '25+': number;
}

export interface NFTCollectionHolderTop {
  address: string;
  amount: number;
}

export interface NFTCollectionHolderTrended {
  time: number;
  holders: number;
}

export interface NFTCollectionListingDepth {
  count: number;
  price: number;
  avg: number;
  total: number;
}

export interface NFTCollectionListingIndividual {
  name: string;
  image: string;
  price: number;
  time: number;
  market?: string;
}

export interface NFTCollectionListingTrended {
  time: number;
  listings: number;
  price: number;
}

export interface NFTCollectionVolumeTrended {
  time: number;
  volume: number;
  sales: number;
  price: number;
}

export interface NFTCollectionRarity {
  [category: string]: {
    [trait: string]: number;
  };
}

export interface NFTCollectionRarityRank {
  rank: number;
}

export interface NFTCollectionTraitPrice {
  [category: string]: {
    [trait: string]: number;
  };
}

export interface NFTMarketVolumeTrended {
  time: number;
  value: number;
}

export interface NFTMarketplaceStats {
  name: string;
  volume: number;
  sales: number;
  avgSale: number;
  listings: number;
  users: number;
  fees: number;
  liquidity: number;
  royalties: number;
}

export interface NFTTopTimeframe {
  rank: number;
  price24hChg: number;
  price7dChg: number;
  price30dChg: number;
  listings: number;
  logo: string;
  marketCap: number;
  name: string;
  policy: string;
  price: number;
  supply: number;
  volume24h: number;
  volume7d: number;
  volume30d: number;
  volume24hChg: number;
  volume7dChg: number;
  volume30dChg: number;
}

export interface NFTTopVolume {
  policy: string;
  name: string;
  logo: string;
  price: number;
  volume: number;
  listings: number;
  supply: number;
  sales: number;
}

export interface NFTTopVolumeExtended extends NFTTopVolume {
  pricePctChg: number;
  volumePctChg: number;
  listingsPctChg: number;
  ownersPctChg: number;
  salesPctChg: number;
}

export interface TokenDebtLoan {
  time: number;
  expiration: number;
  hash: string;
  protocol: string;
  interestToken: string;
  debtToken: string;
  collateralToken: string;
  interestAmount: number;
  debtAmount: number;
  collateralAmount: number;
  interestValue: number;
  debtValue: number;
  collateralValue: number;
  health: number;
}

export interface TokenDebtOffer {
  time: number;
  duration: number;
  hash: string;
  protocol: string;
  interestToken: string;
  debtToken: string;
  collateralToken: string;
  interestAmount: number;
  debtAmount: number;
  collateralAmount: number;
  interestValue: number;
  debtValue: number;
  collateralValue: number;
  health: number;
}

export interface TokenIndicator {
  value: number;
}

export interface WalletPortfolioPosition {
  adaValue: number;
  adaBalance: number;
  numFTs: number;
  numNFTs: number;
  liquidValue: number;
  positionsFt: {
    ticker: string;
    balance: number;
    unit: string;
    fingerprint: string;
    price: number;
    adaValue: number;
    '24h': number;
    '7d': number;
    '30d': number;
    liquidBalance: number;
    liquidValue: number;
  }[];
  positionsNft: {
    name: string;
    policy: string;
    balance: number;
    adaValue: number;
    floorPrice: number;
    '24h': number;
    '7d': number;
    '30d': number;
    listings: number;
    liquidValue: number;
  }[];
  positionsLp: {
    ticker: string;
    unit: string;
    amountLP: number;
    tokenA: string;
    tokenAName: string;
    tokenAAmount: number;
    tokenB: string;
    tokenBName: string;
    tokenBAmount: number;
    adaValue: number;
    exchange: string;
  }[];
}

export interface WalletTradeToken {
  action: string;
  time: number;
  tokenA: string;
  tokenAName: string;
  tokenAAmount: number;
  tokenB: string;
  tokenBName: string;
  tokenBAmount: number;
}

export interface WalletValueTrended {
  time: number;
  value: number;
}
