import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { TokenPrice, TokenPriceChange, TokenMcap, TokenQuote, TokenHolders, TokenHolder, TokenPool, TokenOHLCV, TokenTrade, TokenTradingStats, TokenLinks, TopToken, TopTokenMcap, TopTokenLiquidity, NFTCollectionInfo, NFTCollectionStats, NFTCollectionStatsExtended, NFTAssetStats, NFTAssetTraits, NFTCollectionTradesStats, NFTCollectionListings, NFTCollectionOHLCV, NFTCollectionTrade, NFTMarketStats, NFTMarketStatsExtended, NFTAssetSale, NFTCollectionAsset, NFTCollectionHoldersDistribution, NFTCollectionHolderTop, NFTCollectionHolderTrended, NFTCollectionListingDepth, NFTCollectionListingIndividual, NFTCollectionListingTrended, NFTCollectionVolumeTrended, NFTCollectionRarity, NFTCollectionRarityRank, NFTCollectionTraitPrice, NFTMarketVolumeTrended, NFTMarketplaceStats, NFTTopTimeframe, NFTTopVolume, NFTTopVolumeExtended, TokenDebtLoan, TokenDebtOffer, TokenIndicator, WalletPortfolioPosition, WalletTradeToken, WalletValueTrended, AddressUtxo } from "external/taptools/types";
import { AddressInfo } from "net";
import { firstValueFrom } from "rxjs";

@Injectable()
export class TaptoolsService {
    constructor(private readonly client: HttpService) { }



    // Token Endpoints

    /**
     * Get token prices for specified units
     * @param units - Array of token units (policy + hex name)
     * @returns Promise with token prices
     */
    async getTokenPrices(units: string[]): Promise<TokenPrice> {
        const response = await firstValueFrom(this.client.post<TokenPrice>('token/prices', units));
        return response.data;
    }

    /**
     * Get token price changes for a specific unit
     * @param unit - Token unit (policy + hex name)
     * @returns Promise with token price changes
     */
    async getTokenPriceChanges(unit: string): Promise<TokenPriceChange> {
        const response = await firstValueFrom(this.client.get<TokenPriceChange>('token/price-changes', { params: { unit } }));
        return response.data;
    }

    /**
     * Get token market cap information
     * @param unit - Token unit (policy + hex name)
     * @returns Promise with token market cap information
     */
    async getTokenMcap(unit: string): Promise<TokenMcap> {
        const response = await firstValueFrom(this.client.get<TokenMcap>('token/mcap', { params: { unit } }));
        return response.data;
    }

    /**
     * Get token price in a specific quote currency
     * @param unit - Token unit (policy + hex name)
     * @param quote - Quote currency (e.g., USD, EUR)
     * @returns Promise with token quote information
     */
    async getTokenQuote(unit: string, quote: string): Promise<TokenQuote> {
        const response = await firstValueFrom(this.client.get<TokenQuote>('token/quote', { params: { unit, quote } }));
        return response.data;
    }

    /**
     * Get available quote currencies
     * @returns Promise with available quote currencies
     */
    async getAvailableQuotes(): Promise<string[]> {
        const response = await firstValueFrom(this.client.get<string[]>('token/quote/available'));
        return response.data;
    }

    /**
     * Get token holders count
     * @param unit - Token unit (policy + hex name)
     * @returns Promise with token holders count
     */
    async getTokenHolders(unit: string): Promise<TokenHolders> {
        const response = await firstValueFrom(this.client.get<TokenHolders>('token/holders', { params: { unit } }));
        return response.data;
    }

    /**
     * Get top token holders
     * @param unit - Token unit (policy + hex name)
     * @param page - Page number (default: 1)
     * @param perPage - Items per page (default: 10, max: 100)
     * @returns Promise with top token holders
     */
    async getTopTokenHolders(unit: string, page = 1, perPage = 10): Promise<TokenHolder[]> {
        const response = await firstValueFrom(this.client.get<TokenHolder[]>('token/holders/top', { params: { unit, page, perPage } }));
        return response.data;
    }

    /**
     * Get token pools
     * @param unit - Token unit (policy + hex name)
     * @returns Promise with token pools
     */
    async getTokenPools(unit: string): Promise<TokenPool[]> {
        const response = await firstValueFrom(this.client.get<TokenPool[]>('token/pools', { params: { unit } }));
        return response.data;
    }

    /**
     * Get token OHLCV data
     * @param unit - Token unit (policy + hex name)
     * @param interval - Time interval (e.g., 1h, 4h, 1d)
     * @param numIntervals - Number of intervals to return
     * @param quote - Quote currency (default: ADA)
     * @returns Promise with token OHLCV data
     */
    async getTokenOHLCV(unit: string, interval: string, numIntervals?: number, quote = 'USD'): Promise<TokenOHLCV[]> {
        const response = await firstValueFrom(this.client.get<TokenOHLCV[]>('token/ohlcv', { params: { unit, interval, numIntervals, quote } }));
        return response.data;
    }

    /**
     * Get token trades
     * @param unit - Token unit (policy + hex name)
     * @param timeframe - Time frame (e.g., 24h, 7d, 30d)
     * @param page - Page number (default: 1)
     * @param perPage - Items per page (default: 100, max: 100)
     * @returns Promise with token trades
     */
    async getTokenTrades(unit: string, timeframe = '24h', page = 1, perPage = 100): Promise<TokenTrade[]> {
        const response = await firstValueFrom(this.client.get<TokenTrade[]>('token/trades', { params: { unit, timeframe, page, perPage, sortBy: 'time', order: 'desc' } }));
        return response.data;
    }

    /**
     * Get token trading stats
     * @param unit - Token unit (policy + hex name)
     * @param timeframe - Time frame (e.g., 24h, 7d, 30d)
     * @returns Promise with token trading stats
     */
    async getTokenTradingStats(unit: string, timeframe = '24h'): Promise<TokenTradingStats> {
        const response = await firstValueFrom(this.client.get<TokenTradingStats>('token/trading/stats', { params: { unit, timeframe } }));
        return response.data;
    }

    /**
     * Get token links
     * @param unit - Token unit (policy + hex name)
     * @returns Promise with token links
     */
    async getTokenLinks(unit: string): Promise<TokenLinks> {
        const response = await firstValueFrom(this.client.get<TokenLinks>('token/links', { params: { unit } }));
        return response.data;
    }

    /**
     * Get top tokens by volume
     * @param timeframe - Time frame (e.g., 24h, 7d, 30d)
     * @param page - Page number (default: 1)
     * @param perPage - Items per page (default: 10, max: 100)
     * @returns Promise with top tokens by volume
     */
    async getTopTokensByVolume(timeframe = '24h', page = 1, perPage = 10): Promise<TopToken[]> {
        const response = await firstValueFrom(this.client.get<TopToken[]>('token/top/volume', { params: { timeframe, page, perPage } }));
        return response.data;
    }

    /**
     * Get top tokens by market cap
     * @param page - Page number (default: 1)
     * @param perPage - Items per page (default: 10, max: 100)
     * @returns Promise with top tokens by market cap
     */
    async getTopTokensByMcap(page = 1, perPage = 10): Promise<TopTokenMcap[]> {
        const response = await firstValueFrom(this.client.get<TopTokenMcap[]>('token/top/mcap', { params: { type: 'mcap', page, perPage } }));
        return response.data;
    }

    /**
     * Get top tokens by liquidity
     * @param page - Page number (default: 1)
     * @param perPage - Items per page (default: 10, max: 100)
     * @returns Promise with top tokens by liquidity
     */
    async getTopTokensByLiquidity(page = 1, perPage = 10): Promise<TopTokenLiquidity[]> {
        const response = await firstValueFrom(this.client.get<TopTokenLiquidity[]>('token/top/liquidity', { params: { page, perPage } }));
        return response.data;
    }

    // NFT Endpoints

    /**
     * Get NFT collection information
     * @param policy - Collection policy ID
     * @returns Promise with NFT collection information
     */
    async getNFTCollectionInfo(policy: string): Promise<NFTCollectionInfo> {
        const response = await firstValueFrom(this.client.get<NFTCollectionInfo>('nft/collection/info', { params: { policy } }));
        return response.data;
    }

    /**
     * Get NFT collection stats
     * @param policy - Collection policy ID
     * @returns Promise with NFT collection stats
     */
    async getNFTCollectionStats(policy: string): Promise<NFTCollectionStats> {
        const response = await firstValueFrom(this.client.get<NFTCollectionStats>('nft/collection/stats', { params: { policy } }));
        return response.data;
    }

    /**
     * Get NFT collection extended stats
     * @param policy - Collection policy ID
     * @param timeframe - Time frame (e.g., 24h, 7d, 30d)
     * @returns Promise with NFT collection extended stats
     */
    async getNFTCollectionStatsExtended(policy: string, timeframe = '24h'): Promise<NFTCollectionStatsExtended> {
        const response = await firstValueFrom(this.client.get<NFTCollectionStatsExtended>('nft/collection/stats/extended', { params: { policy, timeframe } }));
        return response.data;
    }

    /**
     * Get NFT asset stats
     * @param policy - Collection policy ID
     * @param name - NFT name
     * @returns Promise with NFT asset stats
     */
    async getNFTAssetStats(policy: string, name: string): Promise<NFTAssetStats> {
        const response = await firstValueFrom(this.client.get<NFTAssetStats>('nft/asset/stats', { params: { policy, name } }));
        return response.data;
    }

    /**
     * Get NFT asset traits
     * @param policy - Collection policy ID
     * @param name - NFT name
     * @param prices - Include prices (0 or 1, default: 1)
     * @returns Promise with NFT asset traits
     */
    async getNFTAssetTraits(policy: string, name: string, prices = 1): Promise<NFTAssetTraits> {
        const response = await firstValueFrom(this.client.get<NFTAssetTraits>('nft/asset/traits', { params: { policy, name, prices } }));
        return response.data;
    }

    /**
     * Get NFT collection trades stats
     * @param policy - Collection policy ID
     * @param timeframe - Time frame (e.g., 24h, 7d, 30d)
     * @returns Promise with NFT collection trades stats
     */
    async getNFTCollectionTradesStats(policy: string, timeframe = '24h'): Promise<NFTCollectionTradesStats> {
        const response = await firstValueFrom(this.client.get<NFTCollectionTradesStats>('nft/collection/trades/stats', { params: { policy, timeframe } }));
        return response.data;
    }

    /**
     * Get NFT collection listings
     * @param policy - Collection policy ID
     * @returns Promise with NFT collection listings
     */
    async getNFTCollectionListings(policy: string): Promise<NFTCollectionListings> {
        const response = await firstValueFrom(this.client.get<NFTCollectionListings>('nft/collection/listings', { params: { policy } }));
        return response.data;
    }

    /**
     * Get NFT collection OHLCV data
     * @param policy - Collection policy ID
     * @param interval - Time interval (e.g., 1h, 4h, 1d)
     * @param numIntervals - Number of intervals to return
     * @param quote - Quote currency (default: ADA)
     * @returns Promise with NFT collection OHLCV data
     */
    async getNFTCollectionOHLCV(policy: string, interval: string, numIntervals?: number, quote = 'ADA'): Promise<NFTCollectionOHLCV[]> {
        const response = await firstValueFrom(this.client.get<NFTCollectionOHLCV[]>('nft/collection/ohlcv', { params: { policy, interval, numIntervals, quote } }));
        return response.data;
    }

    /**
     * Get NFT collection trades
     * @param policy - Collection policy ID
     * @param timeframe - Time frame (e.g., 24h, 7d, 30d)
     * @param page - Page number (default: 1)
     * @param perPage - Items per page (default: 100, max: 100)
     * @returns Promise with NFT collection trades
     */
    async getNFTCollectionTrades(policy: string, timeframe = '30d', page = 1, perPage = 100): Promise<NFTCollectionTrade[]> {
        const response = await firstValueFrom(this.client.get<NFTCollectionTrade[]>('nft/collection/trades', { params: { policy, timeframe, page, perPage } }));
        return response.data;
    }

    /**
     * Get NFT market stats
     * @param timeframe - Time frame (e.g., 24h, 7d, 30d)
     * @returns Promise with NFT market stats
     */
    async getNFTMarketStats(timeframe = '24h'): Promise<NFTMarketStats> {
        const response = await firstValueFrom(this.client.get<NFTMarketStats>('nft/market/stats', { params: { timeframe } }));
        return response.data;
    }

    /**
     * Get NFT market extended stats
     * @param timeframe - Time frame (e.g., 24h, 7d, 30d)
     * @returns Promise with NFT market extended stats
     */
    async getNFTMarketStatsExtended(timeframe = '24h'): Promise<NFTMarketStatsExtended> {
        const response = await firstValueFrom(
            this.client.get<NFTMarketStatsExtended>('nft/market/stats/extended', { params: { timeframe } })
        );
        return response.data;
    }

    // NFT Endpoints (Additional)

    /**
     * Get NFT asset sales history
     * @param policy - Collection policy ID
     * @param name - NFT name
     * @returns Promise with NFT asset sales history
     */
    async getNFTAssetSales(policy: string, name: string): Promise<NFTAssetSale[]> {
        const response = await firstValueFrom(
            this.client.get<NFTAssetSale[]>('nft/asset/sales', { params: { policy, name } })
        );
        return response.data;
    }

    /**
     * Get NFT collection assets
     * @param policy - Collection policy ID
     * @param sortBy - Sort by (price or rank)
     * @param order - Sort order (asc or desc)
     * @param search - Search by name
     * @param onSale - Filter by on sale status
     * @param page - Page number
     * @param perPage - Items per page
     */
    async getNFTCollectionAssets(
        policy: string,
        sortBy = 'price',
        order = 'asc',
        search?: string,
        onSale = 0,
        page = 1,
        perPage = 100
    ): Promise<NFTCollectionAsset[]> {
        const response = await firstValueFrom(
            this.client.get<NFTCollectionAsset[]>('nft/collection/assets', {
                params: { policy, sortBy, order, search, onSale, page, perPage }
            })
        );
        return response.data;
    }

    /**
     * Get NFT collection holders distribution
     * @param policy - Collection policy ID
     */
    async getNFTCollectionHoldersDistribution(policy: string): Promise<NFTCollectionHoldersDistribution> {
        const response = await firstValueFrom(
            this.client.get<NFTCollectionHoldersDistribution>('nft/collection/holders/distribution', { params: { policy } })
        );
        return response.data;
    }

    /**
     * Get NFT collection top holders
     * @param policy - Collection policy ID
     * @param page - Page number
     * @param perPage - Items per page
     * @param excludeExchanges - Whether to exclude exchange addresses
     */
    async getNFTCollectionTopHolders(
        policy: string,
        page = 1,
        perPage = 10,
        excludeExchanges = 1
    ): Promise<NFTCollectionHolderTop[]> {
        const response = await firstValueFrom(
            this.client.get<NFTCollectionHolderTop[]>('nft/collection/holders/top', {
                params: { policy, page, perPage, excludeExchanges }
            })
        );
        return response.data;
    }

    /**
     * Get NFT collection trended holders
     * @param policy - Collection policy ID
     * @param timeframe - Time frame
     */
    async getNFTCollectionTrendedHolders(
        policy: string,
        timeframe = '30d'
    ): Promise<NFTCollectionHolderTrended[]> {
        const response = await firstValueFrom(
            this.client.get<NFTCollectionHolderTrended[]>('nft/collection/holders/trended', {
                params: { policy, timeframe }
            })
        );
        return response.data;
    }

    /**
     * Get NFT collection listings depth
     * @param policy - Collection policy ID
     * @param items - Number of items to return
     */
    async getNFTCollectionListingsDepth(
        policy: string,
        items = 500
    ): Promise<NFTCollectionListingDepth[]> {
        const response = await firstValueFrom(
            this.client.get<NFTCollectionListingDepth[]>('nft/collection/listings/depth', {
                params: { policy, items }
            })
        );
        return response.data;
    }

    /**
     * Get NFT collection individual listings
     * @param policy - Collection policy ID
     * @param sortBy - Sort by field
     * @param order - Sort order
     * @param page - Page number
     * @param perPage - Items per page
     */
    async getNFTCollectionIndividualListings(
        policy: string,
        sortBy = 'price',
        order = 'asc',
        page = 1,
        perPage = 100
    ): Promise<NFTCollectionListingIndividual[]> {
        const response = await firstValueFrom(
            this.client.get<NFTCollectionListingIndividual[]>('nft/collection/listings/individual', {
                params: { policy, sortBy, order, page, perPage }
            })
        );
        return response.data;
    }

    /**
     * Get NFT collection trended listings
     * @param policy - Collection policy ID
     * @param interval - Time interval
     * @param numIntervals - Number of intervals
     */
    async getNFTCollectionTrendedListings(
        policy: string,
        interval: string,
        numIntervals?: number
    ): Promise<NFTCollectionListingTrended[]> {
        const response = await firstValueFrom(
            this.client.get<NFTCollectionListingTrended[]>('nft/collection/listings/trended', {
                params: { policy, interval, numIntervals }
            })
        );
        return response.data;
    }

    /**
     * Get NFT collection trended volume
     * @param policy - Collection policy ID
     * @param interval - Time interval
     * @param numIntervals - Number of intervals
     */
    async getNFTCollectionTrendedVolume(
        policy: string,
        interval: string,
        numIntervals?: number
    ): Promise<NFTCollectionVolumeTrended[]> {
        const response = await firstValueFrom(
            this.client.get<NFTCollectionVolumeTrended[]>('nft/collection/volume/trended', {
                params: { policy, interval, numIntervals }
            })
        );
        return response.data;
    }

    /**
     * Get NFT collection rarity
     * @param policy - Collection policy ID
     */
    async getNFTCollectionRarity(policy: string): Promise<NFTCollectionRarity> {
        const response = await firstValueFrom(
            this.client.get<NFTCollectionRarity>('nft/collection/traits/rarity', { params: { policy } })
        );
        return response.data;
    }

    /**
     * Get NFT rarity rank
     * @param policy - Collection policy ID
     * @param name - NFT name
     */
    async getNFTRarityRank(policy: string, name: string): Promise<NFTCollectionRarityRank> {
        const response = await firstValueFrom(
            this.client.get<NFTCollectionRarityRank>('nft/collection/traits/rarity/rank', { params: { policy, name } })
        );
        return response.data;
    }

    /**
     * Get NFT collection trait prices
     * @param policy - Collection policy ID
     * @param name - NFT name (optional)
     */
    async getNFTCollectionTraitPrices(policy: string, name?: string): Promise<NFTCollectionTraitPrice> {
        const response = await firstValueFrom(
            this.client.get<NFTCollectionTraitPrice>('nft/collection/traits/price', { params: { policy, name } })
        );
        return response.data;
    }

    /**
     * Get NFT market volume trended
     * @param timeframe - Time frame
     */
    async getNFTMarketVolumeTrended(timeframe = '30d'): Promise<NFTMarketVolumeTrended[]> {
        const response = await firstValueFrom(
            this.client.get<NFTMarketVolumeTrended[]>('nft/market/volume/trended', { params: { timeframe } })
        );
        return response.data;
    }

    /**
     * Get NFT marketplace stats
     * @param timeframe - Time frame
     * @param marketplace - Marketplace name
     * @param lastDay - Filter to last day only
     */
    async getNFTMarketplaceStats(
        timeframe = '7d',
        marketplace?: string,
        lastDay = 0
    ): Promise<NFTMarketplaceStats[]> {
        const response = await firstValueFrom(
            this.client.get<NFTMarketplaceStats[]>('nft/marketplace/stats', {
                params: { timeframe, marketplace, lastDay }
            })
        );
        return response.data;
    }

    /**
     * Get NFT top rankings
     * @param ranking - Ranking criteria
     * @param items - Number of items
     */
    async getNFTTopRankings(ranking: string, items = 25): Promise<NFTTopTimeframe[]> {
        const response = await firstValueFrom(
            this.client.get<NFTTopTimeframe[]>('nft/top/timeframe', { params: { ranking, items } })
        );
        return response.data;
    }

    /**
     * Get NFT top volume collections
     * @param timeframe - Time frame
     * @param page - Page number
     * @param perPage - Items per page
     */
    async getNFTTopVolume(
        timeframe = '24h',
        page = 1,
        perPage = 10
    ): Promise<NFTTopVolume[]> {
        const response = await firstValueFrom(
            this.client.get<NFTTopVolume[]>('nft/top/volume', { params: { timeframe, page, perPage } })
        );
        return response.data;
    }

    /**
     * Get NFT top volume collections (extended)
     * @param timeframe - Time frame
     * @param page - Page number
     * @param perPage - Items per page
     */
    async getNFTTopVolumeExtended(
        timeframe = '24h',
        page = 1,
        perPage = 10
    ): Promise<NFTTopVolumeExtended[]> {
        const response = await firstValueFrom(
            this.client.get<NFTTopVolumeExtended[]>('nft/top/volume/extended', {
                params: { timeframe, page, perPage }
            })
        );
        return response.data;
    }

    // Token Debt Endpoints

    /**
     * Get active P2P loans
     * @param unit - Token unit
     * @param include - Filter by token usage
     * @param sortBy - Sort by field
     * @param order - Sort order
     * @param page - Page number
     * @param perPage - Items per page
     */
    async getTokenDebtLoans(
        unit: string,
        include = 'collateral,debt',
        sortBy = 'time',
        order = 'desc',
        page = 1,
        perPage = 100
    ): Promise<TokenDebtLoan[]> {
        const response = await firstValueFrom(
            this.client.get<TokenDebtLoan[]>('token/debt/loans', {
                params: { unit, include, sortBy, order, page, perPage }
            })
        );
        return response.data;
    }

    /**
     * Get active P2P loan offers
     * @param unit - Token unit
     * @param include - Filter by token usage
     * @param sortBy - Sort by field
     * @param order - Sort order
     * @param page - Page number
     * @param perPage - Items per page
     */
    async getTokenDebtOffers(
        unit: string,
        include = 'collateral,debt',
        sortBy = 'time',
        order = 'desc',
        page = 1,
        perPage = 100
    ): Promise<TokenDebtOffer[]> {
        const response = await firstValueFrom(
            this.client.get<TokenDebtOffer[]>('token/debt/offers', {
                params: { unit, include, sortBy, order, page, perPage }
            })
        );
        return response.data;
    }

    /**
     * Get token price indicators
     * @param unit - Token unit
     * @param interval - Time interval
     * @param items - Number of items
     * @param indicator - Indicator type
     * @param length - Data length
     * @param smoothingFactor - Smoothing factor
     * @param fastLength - Fast length for MACD
     * @param slowLength - Slow length for MACD
     * @param signalLength - Signal length for MACD
     * @param stdMult - Standard deviation multiplier
     * @param quote - Quote currency
     */
    async getTokenIndicators(
        unit: string,
        interval: string,
        items?: number,
        indicator = 'ma',
        length?: number,
        smoothingFactor?: number,
        fastLength?: number,
        slowLength?: number,
        signalLength?: number,
        stdMult?: number,
        quote = 'ADA'
    ): Promise<TokenIndicator[]> {
        const response = await firstValueFrom(
            this.client.get<TokenIndicator[]>('token/indicators', {
                params: {
                    unit,
                    interval,
                    items,
                    indicator,
                    length,
                    smoothingFactor,
                    fastLength,
                    slowLength,
                    signalLength,
                    stdMult,
                    quote
                }
            })
        );
        return response.data;
    }

    // Wallet Portfolio Endpoints

    /**
     * Get wallet portfolio positions
     * @param address - Wallet address
     */
    async getWalletPortfolioPositions(address: string): Promise<WalletPortfolioPosition> {
        const response = await firstValueFrom(
            this.client.get<WalletPortfolioPosition>('wallet/portfolio/positions', { params: { address } })
        );
        return response.data;
    }

    /**
     * Get wallet token trade history
     * @param address - Wallet address
     * @param unit - Token unit
     * @param page - Page number
     * @param perPage - Items per page
     */
    async getWalletTokenTrades(
        address: string,
        unit?: string,
        page = 1,
        perPage = 100
    ): Promise<WalletTradeToken[]> {
        const response = await firstValueFrom(
            this.client.get<WalletTradeToken[]>('wallet/trades/tokens', {
                params: { address, unit, page, perPage }
            })
        );
        return response.data;
    }

    /**
     * Get wallet value trended
     * @param address - Wallet address
     * @param timeframe - Time frame
     * @param quote - Quote currency
     */
    async getWalletValueTrended(
        address: string,
        timeframe = '30d',
        quote = 'ADA'
    ): Promise<WalletValueTrended[]> {
        const response = await firstValueFrom(
            this.client.get<WalletValueTrended[]>('wallet/value/trended', {
                params: { address, timeframe, quote }
            })
        );
        return response.data;
    }

    // Onchain Endpoints

    /**
     * Get asset supply
     * @param unit - Token unit (policy + hex name)
     * @returns Promise with asset supply
     */
    async getAssetSupply(unit: string): Promise<{ supply: number }> {
        const response = await firstValueFrom(
            this.client.get<{ supply: number }>('assets/supply', { params: { unit } })
        );
        return response.data;
    }

    /**
     * Get address information
     * @param address - Cardano address
     * @returns Promise with address information
     */
    async getAddressInfo(address: string): Promise<AddressInfo> {
        const response = await firstValueFrom(
            this.client.get<AddressInfo>('address/info', { params: { address } })
        );
        return response.data;
    }

    /**
     * Get address UTXOs
     * @param address - Cardano address
     * @param page - Page number (default: 1)
     * @param perPage - Items per page (default: 100, max: 100)
     * @returns Promise with address UTXOs
     */
    async getAddressUTXOs(address: string, page = 1, perPage = 100): Promise<AddressUtxo[]> {
        const response = await firstValueFrom(
            this.client.get<AddressUtxo[]>('address/utxos', { params: { address, page, perPage } })
        );
        return response.data;
    }

    // Market Endpoints

    /**
     * Get market stats
     * @param quote - Quote currency (default: ADA)
     * @returns Promise with market stats
     */
    async getMarketStats(quote = 'ADA'): Promise<{ activeAddresses: number; dexVolume: number }> {
        const response = await firstValueFrom(
            this.client.get<{ activeAddresses: number; dexVolume: number }>('market/stats', { params: { quote } })
        );
        return response.data;
    }
}