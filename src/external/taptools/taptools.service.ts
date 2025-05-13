import { EError } from "@constants/error.constant";
import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { BadRequestException } from "@shared/exception";
import { TokenPrice, TokenPriceChange, TokenMcap, TokenQuote, TokenHolders, TokenHolder, TokenPool, TokenOHLCV, TokenTrade, TokenTradingStats, TokenLinks, TopToken, TopTokenMcap, TopTokenLiquidity, NFTCollectionInfo, NFTCollectionStats, NFTCollectionStatsExtended, NFTAssetStats, NFTAssetTraits, NFTCollectionTradesStats, NFTCollectionListings, NFTCollectionOHLCV, NFTCollectionTrade, NFTMarketStats, NFTMarketStatsExtended, NFTAssetSale, NFTCollectionAsset, NFTCollectionHoldersDistribution, NFTCollectionHolderTop, NFTCollectionHolderTrended, NFTCollectionListingDepth, NFTCollectionListingIndividual, NFTCollectionListingTrended, NFTCollectionVolumeTrended, NFTCollectionRarity, NFTCollectionRarityRank, NFTCollectionTraitPrice, NFTMarketVolumeTrended, NFTMarketplaceStats, NFTTopTimeframe, NFTTopVolume, NFTTopVolumeExtended, TokenDebtLoan, TokenDebtOffer, TokenIndicator, WalletPortfolioPosition, WalletTradeToken, WalletValueTrended, AddressUtxo, AddressInfo } from "external/taptools/types";
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
        try {
            const response = await firstValueFrom(this.client.post<TokenPrice>('token/prices', units));
            return response.data;
        } catch (error) {
            console.error('TaptoolsService::getTokenPrices error:', error);
            throw new BadRequestException({
                message: 'Get token prices failed',
                validatorErrors: EError.TAPTOOLS_GET_TOKEN_PRICES_FAILED,
                data: error
            })
        }
    }

    /**
     * Get token price changes for a specific unit
     * @param unit - Token unit (policy + hex name)
     * @returns Promise with token price changes
     */
    async getTokenPriceChanges(unit: string): Promise<TokenPriceChange> {
        try {
            const response = await firstValueFrom(this.client.get<TokenPriceChange>('token/price-changes', { params: { unit } }));
            return response.data;
        } catch (error) {
            console.error('TaptoolsService::getTokenPriceChanges error:', error);
            throw new BadRequestException({
                message: 'Get token price changes failed',
                validatorErrors: EError.TAPTOOLS_GET_TOKEN_PRICE_CHANGES_FAILED,
                data: error
            })
        }
    }

    /**
     * Get token market cap information
     * @param unit - Token unit (policy + hex name)
     * @returns Promise with token market cap information
     */
    async getTokenMcap(unit: string): Promise<TokenMcap> {
        try {
            const response = await firstValueFrom(this.client.get<TokenMcap>('token/mcap', { params: { unit } }));
            return response.data;
        } catch (error) {
            console.error('TaptoolsService::getTokenMcap error:', error);
            throw new BadRequestException({
                message: 'Get token market cap failed',
                validatorErrors: EError.TAPTOOLS_GET_TOKEN_MCAP_FAILED,
                data: error
            })
        }
    }

    /**
     * Get token price in a specific quote currency
     * @param unit - Token unit (policy + hex name)
     * @param quote - Quote currency (e.g., USD, EUR)
     * @returns Promise with token quote information
     */
    async getTokenQuote(unit: string, quote: string): Promise<TokenQuote> {
        try {
            const response = await firstValueFrom(this.client.get<TokenQuote>('token/quote', { params: { unit, quote } }));
            return response.data;
        } catch (error) {
            console.error('TaptoolsService::getTokenQuote error:', error);
            throw new BadRequestException({
                message: 'Get token quote failed',
                validatorErrors: EError.TAPTOOLS_GET_TOKEN_QUOTE_FAILED,
                data: error
            })
        }
    }

    /**
     * Get available quote currencies
     * @returns Promise with available quote currencies
     */
    async getAvailableQuotes(): Promise<string[]> {
        try {
            const response = await firstValueFrom(this.client.get<string[]>('token/quote/available'));
            return response.data;
        } catch (error) {
            console.error('TaptoolsService::getAvailableQuotes error:', error);
            throw new BadRequestException({
                message: 'Get available quotes failed',
                validatorErrors: EError.TAPTOOLS_GET_AVAILABLE_QUOTES_FAILED,
                data: error
            })
        }
    }

    /**
     * Get token holders count
     * @param unit - Token unit (policy + hex name)
     * @returns Promise with token holders count
     */
    async getTokenHolders(unit: string): Promise<TokenHolders> {
        try {
            const response = await firstValueFrom(this.client.get<TokenHolders>('token/holders', { params: { unit } }));
            return response.data;
        } catch (error) {
            console.error('TaptoolsService::getTokenHolders error:', error);
            throw new BadRequestException({
                message: 'Get token holders failed',
                validatorErrors: EError.TAPTOOLS_GET_TOKEN_HOLDERS_FAILED,
                data: error
            })
        }
    }

    /**
     * Get top token holders
     * @param unit - Token unit (policy + hex name)
     * @param page - Page number (default: 1)
     * @param perPage - Items per page (default: 10, max: 100)
     * @returns Promise with top token holders
     */
    async getTopTokenHolders(unit: string, page = 1, perPage = 10): Promise<TokenHolder[]> {
        try {
            const response = await firstValueFrom(this.client.get<TokenHolder[]>('token/holders/top', { params: { unit, page, perPage } }));
            return response.data;
        } catch (error) {
            console.error('TaptoolsService::getTopTokenHolders error:', error);
            throw new BadRequestException({
                message: 'Get top token holders failed',
                validatorErrors: EError.TAPTOOLS_GET_TOP_TOKEN_HOLDERS_FAILED,
                data: error
            })
        }
    }

    /**
     * Get token pools
     * @param unit - Token unit (policy + hex name)
     * @returns Promise with token pools
     */
    async getTokenPools(unit: string): Promise<TokenPool[]> {
        try {
            const response = await firstValueFrom(this.client.get<TokenPool[]>('token/pools', { params: { unit } }));
            return response.data;
        } catch (error) {
            console.error('TaptoolsService::getTokenPools error:', error);
            throw new BadRequestException({
                message: 'Get token pools failed',
                validatorErrors: EError.TAPTOOLS_GET_TOKEN_POOLS_FAILED,
                data: error
            })
        }
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
        try {
            const response = await firstValueFrom(this.client.get<TokenOHLCV[]>('token/ohlcv', { params: { unit, interval, numIntervals, quote } }));
            return response.data;
        } catch (error) {
            console.error('TaptoolsService::getTokenOHLCV error:', error);
            throw new BadRequestException({
                message: 'Get token OHLCV failed',
                validatorErrors: EError.TAPTOOLS_GET_TOKEN_OHLCV_FAILED,
                data: error
            })
        }
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
        try {
            const response = await firstValueFrom(this.client.get<TokenTrade[]>('token/trades', { params: { unit, timeframe, page, perPage, sortBy: 'time', order: 'desc' } }));
            return response.data;
        } catch (error) {
            console.error('TaptoolsService::getTokenTrades error:', error);
            throw new BadRequestException({
                message: 'Get token trades failed',
                validatorErrors: EError.TAPTOOLS_GET_TOKEN_TRADES_FAILED,
                data: error
            })
        }
    }

    /**
     * Get token trading stats
     * @param unit - Token unit (policy + hex name)
     * @param timeframe - Time frame (e.g., 24h, 7d, 30d)
     * @returns Promise with token trading stats
     */
    async getTokenTradingStats(unit: string, timeframe = '24h'): Promise<TokenTradingStats> {
        try {
            const response = await firstValueFrom(this.client.get<TokenTradingStats>('token/trading/stats', { params: { unit, timeframe } }));
            return response.data;
        } catch (error) {
            console.error('TaptoolsService::getTokenTradingStats error:', error);
            throw new BadRequestException({
                message: 'Get token trading stats failed',
                validatorErrors: EError.TAPTOOLS_GET_TOKEN_TRADING_STATS_FAILED,
                data: error
            })
        }
    }

    /**
     * Get token links
     * @param unit - Token unit (policy + hex name)
     * @returns Promise with token links
     */
    async getTokenLinks(unit: string): Promise<TokenLinks> {
        try {
            const response = await firstValueFrom(this.client.get<TokenLinks>('token/links', { params: { unit } }));
            return response.data;
        } catch (error) {
            console.error('TaptoolsService::getTokenLinks error:', error);
            throw new BadRequestException({
                message: 'Get token links failed',
                validatorErrors: EError.TAPTOOLS_GET_TOKEN_LINKS_FAILED,
                data: error
            })
        }
    }

    /**
     * Get top tokens by volume
     * @param timeframe - Time frame (e.g., 24h, 7d, 30d)
     * @param page - Page number (default: 1)
     * @param perPage - Items per page (default: 10, max: 100)
     * @returns Promise with top tokens by volume
     */
    async getTopTokensByVolume(timeframe = '24h', page = 1, perPage = 10): Promise<TopToken[]> {
        try {
            const response = await firstValueFrom(this.client.get<TopToken[]>('token/top/volume', { params: { timeframe, page, perPage } }));
            return response.data;
        } catch (error) {
            console.error('TaptoolsService::getTopTokensByVolume error:', error);
            throw new BadRequestException({
                message: 'Get top tokens by volume failed',
                validatorErrors: EError.TAPTOOLS_GET_TOP_VOLUME_TOKENS_FAILED,
                data: error
            })
        }
    }

    /**
     * Get top tokens by market cap
     * @param page - Page number (default: 1)
     * @param perPage - Items per page (default: 10, max: 100)
     * @returns Promise with top tokens by market cap
     */
    async getTopTokensByMcap(page = 1, perPage = 10): Promise<TopTokenMcap[]> {
        try {
            const response = await firstValueFrom(this.client.get<TopTokenMcap[]>('token/top/mcap', { params: { type: 'mcap', page, perPage } }));
            return response.data;
        } catch (error) {
            console.error('TaptoolsService::getTopTokensByMcap error:', error);
            throw new BadRequestException({
                message: 'Get top tokens by market cap failed',
                validatorErrors: EError.TAPTOOLS_GET_TOP_MCAP_TOKENS_FAILED,
                data: error
            })
        }
    }

    /**
     * Get top tokens by liquidity
     * @param page - Page number (default: 1)
     * @param perPage - Items per page (default: 10, max: 100)
     * @returns Promise with top tokens by liquidity
     */
    async getTopTokensByLiquidity(page = 1, perPage = 10): Promise<TopTokenLiquidity[]> {
        try {
            const response = await firstValueFrom(this.client.get<TopTokenLiquidity[]>('token/top/liquidity', { params: { page, perPage } }));
            return response.data;
        } catch (error) {
            console.error('TaptoolsService::getTopTokensByLiquidity error:', error);
            throw new BadRequestException({
                message: 'Get top tokens by liquidity failed',
                validatorErrors: EError.TAPTOOLS_GET_TOP_TOKENS_BY_LIQUIDITY_FAILED,
                data: error
            })
        }
    }

    // NFT Endpoints

    /**
     * Get NFT collection information
     * @param policy - Collection policy ID
     * @returns Promise with NFT collection information
     */
    async getNFTCollectionInfo(policy: string): Promise<NFTCollectionInfo> {
        try {
            const response = await firstValueFrom(this.client.get<NFTCollectionInfo>('nft/collection/info', { params: { policy } }));
            return response.data;
        } catch (error) {
            console.error('TaptoolsService::getNFTCollectionInfo error:', error);
            throw new BadRequestException({
                message: 'Get NFT collection info failed',
                validatorErrors: EError.TAPTOOLS_GET_NFT_COLLECTION_INFO_FAILED,
                data: error
            })
        }
    }

    /**
     * Get NFT collection stats
     * @param policy - Collection policy ID
     * @returns Promise with NFT collection stats
     */
    async getNFTCollectionStats(policy: string): Promise<NFTCollectionStats> {
        try {
            const response = await firstValueFrom(this.client.get<NFTCollectionStats>('nft/collection/stats', { params: { policy } }));
            return response.data;
        } catch (error) {
            console.error('TaptoolsService::getNFTCollectionStats error:', error);
            throw new BadRequestException({
                message: 'Get NFT collection stats failed',
                validatorErrors: EError.TAPTOOLS_GET_NFT_COLLECTION_STATS_FAILED,
                data: error
            })
        }
    }

    /**
     * Get NFT collection extended stats
     * @param policy - Collection policy ID
     * @param timeframe - Time frame (e.g., 24h, 7d, 30d)
     * @returns Promise with NFT collection extended stats
     */
    async getNFTCollectionStatsExtended(policy: string, timeframe = '24h'): Promise<NFTCollectionStatsExtended> {
        try {
            const response = await firstValueFrom(this.client.get<NFTCollectionStatsExtended>('nft/collection/stats/extended', { params: { policy, timeframe } }));
            return response.data;
        } catch (error) {
            console.error('TaptoolsService::getNFTCollectionStatsExtended error:', error);
            throw new BadRequestException({
                message: 'Get NFT collection stats extended failed',
                validatorErrors: EError.TAPTOOLS_GET_NFT_COLLECTION_STATS_EXTENDED_FAILED,
                data: error
            })
        }
    }

    /**
     * Get NFT asset stats
     * @param policy - Collection policy ID
     * @param name - NFT name
     * @returns Promise with NFT asset stats
     */
    async getNFTAssetStats(policy: string, name: string): Promise<NFTAssetStats> {
        try {
            const response = await firstValueFrom(this.client.get<NFTAssetStats>('nft/asset/stats', { params: { policy, name } }));
            return response.data;
        } catch (error) {
            console.error('TaptoolsService::getNFTAssetStats error:', error);
            throw new BadRequestException({
                message: 'Get NFT asset stats failed',
                validatorErrors: EError.TAPTOOLS_GET_NFT_ASSET_STATS_FAILED,
                data: error
            })
        }
    }

    /**
     * Get NFT asset traits
     * @param policy - Collection policy ID
     * @param name - NFT name
     * @param prices - Include prices (0 or 1, default: 1)
     * @returns Promise with NFT asset traits
     */
    async getNFTAssetTraits(policy: string, name: string, prices = 1): Promise<NFTAssetTraits> {
        try {
            const response = await firstValueFrom(this.client.get<NFTAssetTraits>('nft/asset/traits', { params: { policy, name, prices } }));
            return response.data;
        } catch (error) {
            console.error('TaptoolsService::getNFTAssetTraits error:', error);
            throw new BadRequestException({
                message: 'Get NFT asset traits failed',
                validatorErrors: EError.TAPTOOLS_GET_NFT_ASSET_TRAITS_FAILED,
                data: error
            })
        }
    }

    /**
     * Get NFT collection trades stats
     * @param policy - Collection policy ID
     * @param timeframe - Time frame (e.g., 24h, 7d, 30d)
     * @returns Promise with NFT collection trades stats
     */
    async getNFTCollectionTradesStats(policy: string, timeframe = '24h'): Promise<NFTCollectionTradesStats> {
        try {
            const response = await firstValueFrom(this.client.get<NFTCollectionTradesStats>('nft/collection/trades/stats', { params: { policy, timeframe } }));
            return response.data;
        } catch (error) {
            console.error('TaptoolsService::getNFTCollectionTradesStats error:', error);
            throw new BadRequestException({
                message: 'Get NFT collection trades stats failed',
                validatorErrors: EError.TAPTOOLS_GET_NFT_COLLECTION_TRADES_STATS_FAILED,
                data: error
            })
        }
    }

    /**
     * Get NFT collection listings
     * @param policy - Collection policy ID
     * @returns Promise with NFT collection listings
     */
    async getNFTCollectionListings(policy: string): Promise<NFTCollectionListings> {
        try {
            const response = await firstValueFrom(this.client.get<NFTCollectionListings>('nft/collection/listings', { params: { policy } }));
            return response.data;
        } catch (error) {
            console.error('TaptoolsService::getNFTCollectionListings error:', error);
            throw new BadRequestException({
                message: 'Get NFT collection listings failed',
                validatorErrors: EError.TAPTOOLS_GET_NFT_COLLECTION_LISTINGS_FAILED,
                data: error
            })
        }
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
        try {
            const response = await firstValueFrom(this.client.get<NFTCollectionOHLCV[]>('nft/collection/ohlcv', { params: { policy, interval, numIntervals, quote } }));
            return response.data;
        } catch (error) {
            console.error('TaptoolsService::getNFTCollectionOHLCV error:', error);
            throw new BadRequestException({
                message: 'Get NFT collection OHLCV failed',
                validatorErrors: EError.TAPTOOLS_GET_NFT_COLLECTION_OHLCV_FAILED,
                data: error
            })
        }
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
        try {
            const response = await firstValueFrom(this.client.get<NFTCollectionTrade[]>('nft/collection/trades', { params: { policy, timeframe, page, perPage } }));
            return response.data;
        } catch (error) {
            console.error('TaptoolsService::getNFTCollectionTrades error:', error);
            throw new BadRequestException({
                message: 'Get NFT collection trades failed',
                validatorErrors: EError.TAPTOOLS_GET_NFT_COLLECTION_TRADES_FAILED,
                data: error
            })
        }
    }

    /**
     * Get NFT market stats
     * @param timeframe - Time frame (e.g., 24h, 7d, 30d)
     * @returns Promise with NFT market stats
     */
    async getNFTMarketStats(timeframe = '24h'): Promise<NFTMarketStats> {
        try {
            const response = await firstValueFrom(this.client.get<NFTMarketStats>('nft/market/stats', { params: { timeframe } }));
            return response.data;
        } catch (error) {
            console.error('TaptoolsService::getNFTMarketStats error:', error);
            throw new BadRequestException({
                message: 'Get NFT market stats failed',
                validatorErrors: EError.TAPTOOLS_GET_NFT_MARKET_STATS_FAILED,
                data: error
            })
        }
    }

    /**
     * Get NFT market extended stats
     * @param timeframe - Time frame (e.g., 24h, 7d, 30d)
     * @returns Promise with NFT market extended stats
     */
    async getNFTMarketStatsExtended(timeframe = '24h'): Promise<NFTMarketStatsExtended> {
        try {
            const response = await firstValueFrom(
                this.client.get<NFTMarketStatsExtended>('nft/market/stats/extended', { params: { timeframe } })
            );
            return response.data;
        } catch (error) {
            console.error('TaptoolsService::getNFTMarketStatsExtended error:', error);
            throw new BadRequestException({
                message: 'Get NFT market stats extended failed',
                validatorErrors: EError.TAPTOOLS_GET_NFT_MARKET_STATS_EXTENDED_FAILED,
                data: error
            })
        }
    }

    // NFT Endpoints (Additional)

    /**
     * Get NFT asset sales history
     * @param policy - Collection policy ID
     * @param name - NFT name
     * @returns Promise with NFT asset sales history
     */
    async getNFTAssetSales(policy: string, name: string): Promise<NFTAssetSale[]> {
        try {
            const response = await firstValueFrom(
                this.client.get<NFTAssetSale[]>('nft/asset/sales', { params: { policy, name } })
            );
            return response.data;
        } catch (error) {
            console.error('TaptoolsService::getNFTAssetSales error:', error);
            throw new BadRequestException({
                message: 'Get NFT asset sales failed',
                validatorErrors: EError.TAPTOOLS_GET_NFT_ASSET_SALES_FAILED,
                data: error
            })
        }
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
        try {
            const response = await firstValueFrom(
                this.client.get<NFTCollectionAsset[]>('nft/collection/assets', {
                    params: { policy, sortBy, order, search, onSale, page, perPage }
                })
            );
            return response.data;
        } catch (error) {
            console.error('TaptoolsService::getNFTCollectionAssets error:', error);
            throw new BadRequestException({
                message: 'Get NFT collection assets failed',
                validatorErrors: EError.TAPTOOLS_GET_NFT_COLLECTION_ASSETS_FAILED,
                data: error
            })
        }
    }

    /**
     * Get NFT collection holders distribution
     * @param policy - Collection policy ID
     */
    async getNFTCollectionHoldersDistribution(policy: string): Promise<NFTCollectionHoldersDistribution> {
        try {
            const response = await firstValueFrom(
                this.client.get<NFTCollectionHoldersDistribution>('nft/collection/holders/distribution', { params: { policy } })
            );
            return response.data;
        } catch (error) {
            console.error('TaptoolsService::getNFTCollectionHoldersDistribution error:', error);
            throw new BadRequestException({
                message: 'Get NFT collection holders distribution failed',
                validatorErrors: EError.TAPTOOLS_GET_NFT_COLLECTION_HOLDERS_DISTRIBUTION_FAILED,
                data: error
            })
        }
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
        try {
            const response = await firstValueFrom(
                this.client.get<NFTCollectionHolderTop[]>('nft/collection/holders/top', {
                    params: { policy, page, perPage, excludeExchanges }
                })
            );
            return response.data;
        } catch (error) {
            console.error('TaptoolsService::getNFTCollectionTopHolders error:', error);
            throw new BadRequestException({
                message: 'Get NFT collection top holders failed',
                validatorErrors: EError.TAPTOOLS_GET_NFT_COLLECTION_TOP_HOLDERS_FAILED,
                data: error
            })
        }
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
        try {
            const response = await firstValueFrom(
                this.client.get<NFTCollectionHolderTrended[]>('nft/collection/holders/trended', {
                    params: { policy, timeframe }
                })
            );
            return response.data;
        } catch (error) {
            console.error('TaptoolsService::getNFTCollectionTrendedHolders error:', error);
            throw new BadRequestException({
                message: 'Get NFT collection trended holders failed',
                validatorErrors: EError.TAPTOOLS_GET_NFT_COLLECTION_TRENDED_HOLDERS_FAILED,
                data: error
            })
        }
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
        try {
            const response = await firstValueFrom(
                this.client.get<NFTCollectionListingDepth[]>('nft/collection/listings/depth', {
                    params: { policy, items }
                })
            );
            return response.data;
        } catch (error) {
            console.error('TaptoolsService::getNFTCollectionListingsDepth error:', error);
            throw new BadRequestException({
                message: 'Get NFT collection listings depth failed',
                validatorErrors: EError.TAPTOOLS_GET_NFT_COLLECTION_LISTINGS_DEPTH_FAILED,
                data: error
            })
        }
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
        try {
            const response = await firstValueFrom(
                this.client.get<NFTCollectionListingIndividual[]>('nft/collection/listings/individual', {
                    params: { policy, sortBy, order, page, perPage }
                })
            );
            return response.data;
        } catch (error) {
            console.error('TaptoolsService::getNFTCollectionIndividualListings error:', error);
            throw new BadRequestException({
                message: 'Get NFT collection individual listings failed',
                validatorErrors: EError.TAPTOOLS_GET_NFT_COLLECTION_INDIVIDUAL_LISTINGS_FAILED,
                data: error
            })
        }
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
        try {
            const response = await firstValueFrom(
                this.client.get<NFTCollectionListingTrended[]>('nft/collection/listings/trended', {
                    params: { policy, interval, numIntervals }
                })
            );
            return response.data;
        } catch (error) {
            console.error('TaptoolsService::getNFTCollectionTrendedListings error:', error);
            throw new BadRequestException({
                message: 'Get NFT collection trended listings failed',
                validatorErrors: EError.TAPTOOLS_GET_NFT_COLLECTION_TRENDED_LISTINGS_FAILED,
                data: error
            })
        }
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
        try {
            const response = await firstValueFrom(
                this.client.get<NFTCollectionVolumeTrended[]>('nft/collection/volume/trended', {
                    params: { policy, interval, numIntervals }
                })
            );
            return response.data;
        } catch (error) {
            console.error('TaptoolsService::getNFTCollectionTrendedVolume error:', error);
            throw new BadRequestException({
                message: 'Get NFT collection trended volume failed',
                validatorErrors: EError.TAPTOOLS_GET_NFT_COLLECTION_TRENDED_VOLUME_FAILED,
                data: error
            })
        }
    }

    /**
     * Get NFT collection rarity
     * @param policy - Collection policy ID
     */
    async getNFTCollectionRarity(policy: string): Promise<NFTCollectionRarity> {
        try {
            const response = await firstValueFrom(
                this.client.get<NFTCollectionRarity>('nft/collection/traits/rarity', { params: { policy } })
            );
            return response.data;
        } catch (error) {
            console.error('TaptoolsService::getNFTCollectionRarity error:', error);
            throw new BadRequestException({
                message: 'Get NFT collection rarity failed',
                validatorErrors: EError.TAPTOOLS_GET_NFT_COLLECTION_RARITY_FAILED,
                data: error
            })
        }
    }

    /**
     * Get NFT rarity rank
     * @param policy - Collection policy ID
     * @param name - NFT name
     */
    async getNFTRarityRank(policy: string, name: string): Promise<NFTCollectionRarityRank> {
        try {
            const response = await firstValueFrom(
                this.client.get<NFTCollectionRarityRank>('nft/collection/traits/rarity/rank', { params: { policy, name } })
            );
            return response.data;
        } catch (error) {
            console.error('TaptoolsService::getNFTRarityRank error:', error);
            throw new BadRequestException({
                message: 'Get NFT rarity rank failed',
                validatorErrors: EError.TAPTOOLS_GET_NFT_RARITY_RANK_FAILED,
                data: error
            })
        }
    }

    /**
     * Get NFT collection trait prices
     * @param policy - Collection policy ID
     * @param name - NFT name (optional)
     */
    async getNFTCollectionTraitPrices(policy: string, name?: string): Promise<NFTCollectionTraitPrice> {
        try {
            const response = await firstValueFrom(
                this.client.get<NFTCollectionTraitPrice>('nft/collection/traits/price', { params: { policy, name } })
            );
            return response.data;
        } catch (error) {
            console.error('TaptoolsService::getNFTCollectionTraitPrices error:', error);
            throw new BadRequestException({
                message: 'Get NFT collection trait prices failed',
                validatorErrors: EError.TAPTOOLS_GET_NFT_COLLECTION_TRAIT_PRICES_FAILED,
                data: error
            })
        }
    }

    /**
     * Get NFT market volume trended
     * @param timeframe - Time frame
     */
    async getNFTMarketVolumeTrended(timeframe = '30d'): Promise<NFTMarketVolumeTrended[]> {
        try {
            const response = await firstValueFrom(
                this.client.get<NFTMarketVolumeTrended[]>('nft/market/volume/trended', { params: { timeframe } })
            );
            return response.data;
        } catch (error) {
            console.error('TaptoolsService::getNFTMarketVolumeTrended error:', error);
            throw new BadRequestException({
                message: 'Get NFT market volume trended failed',
                validatorErrors: EError.TAPTOOLS_GET_NFT_MARKET_VOLUME_TRENDED_FAILED,
                data: error
            })
        }
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
        try {
            const response = await firstValueFrom(
                this.client.get<NFTMarketplaceStats[]>('nft/marketplace/stats', {
                    params: { timeframe, marketplace, lastDay }
                })
            );
            return response.data;
        } catch (error) {
            console.error('TaptoolsService::getNFTMarketplaceStats error:', error);
            throw new BadRequestException({
                message: 'Get NFT marketplace stats failed',
                validatorErrors: EError.TAPTOOLS_GET_NFT_MARKETPLACE_STATS_FAILED,
                data: error
            })
        }
    }

    /**
     * Get NFT top rankings
     * @param ranking - Ranking criteria
     * @param items - Number of items
     */
    async getNFTTopRankings(ranking: string, items = 25): Promise<NFTTopTimeframe[]> {
        try {
            const response = await firstValueFrom(
                this.client.get<NFTTopTimeframe[]>('nft/top/timeframe', { params: { ranking, items } })
            );
            return response.data;
        } catch (error) {
            console.error('TaptoolsService::getNFTTopRankings error:', error);
            throw new BadRequestException({
                message: 'Get NFT top rankings failed',
                validatorErrors: EError.TAPTOOLS_GET_NFT_TOP_RANKINGS_FAILED,
                data: error
            })
        }
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
        try {
            const response = await firstValueFrom(
                this.client.get<NFTTopVolume[]>('nft/top/volume', { params: { timeframe, page, perPage } })
            );
            return response.data;
        } catch (error) {
            console.error('TaptoolsService::getNFTTopVolume error:', error);
            throw new BadRequestException({
                message: 'Get NFT top volume failed',
                validatorErrors: EError.TAPTOOLS_GET_NFT_TOP_VOLUME_FAILED,
                data: error
            })
        }
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
        try {
            const response = await firstValueFrom(
                this.client.get<NFTTopVolumeExtended[]>('nft/top/volume/extended', {
                    params: { timeframe, page, perPage }
                })
            );
            return response.data;
        } catch (error) {
            console.error('TaptoolsService::getNFTTopVolumeExtended error:', error);
            throw new BadRequestException({
                message: 'Get NFT top volume extended failed',
                validatorErrors: EError.TAPTOOLS_GET_NFT_TOP_VOLUME_EXTENDED_FAILED,
                data: error
            })
        }
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
        try {
            const response = await firstValueFrom(
                this.client.get<TokenDebtLoan[]>('token/debt/loans', {
                    params: { unit, include, sortBy, order, page, perPage }
                })
            );
            return response.data;
        } catch (error) {
            console.error('TaptoolsService::getTokenDebtLoans error:', error);
            throw new BadRequestException({
                message: 'Get token debt loans failed',
                validatorErrors: EError.TAPTOOLS_GET_TOKEN_DEBT_LOANS_FAILED,
                data: error
            })
        }
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
        try {
            const response = await firstValueFrom(
                this.client.get<TokenDebtOffer[]>('token/debt/offers', {
                    params: { unit, include, sortBy, order, page, perPage }
                })
            );
            return response.data;
        } catch (error) {
            console.error('TaptoolsService::getTokenDebtOffers error:', error);
            throw new BadRequestException({
                message: 'Get token debt offers failed',
                validatorErrors: EError.TAPTOOLS_GET_TOKEN_DEBT_OFFERS_FAILED,
                data: error
            })
        }
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
        try {
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
        } catch (error) {
            console.error('TaptoolsService::getTokenIndicators error:', error);
            throw new BadRequestException({
                message: 'Get token indicators failed',
                validatorErrors: EError.TAPTOOLS_GET_TOKEN_INDICATORS_FAILED,
                data: error
            })
        }
    }

    // Wallet Portfolio Endpoints

    /**
     * Get wallet portfolio positions
     * @param address - Wallet address
     */
    async getWalletPortfolioPositions(address: string): Promise<WalletPortfolioPosition> {
        try {
            const response = await firstValueFrom(
                this.client.get<WalletPortfolioPosition>('wallet/portfolio/positions', { params: { address } })
            );
            return response.data;
        } catch (error) {
            console.error('TaptoolsService::getWalletPortfolioPositions error:', error);
            throw new BadRequestException({
                message: 'Get wallet portfolio positions failed',
                validatorErrors: EError.TAPTOOLS_GET_WALLET_PORTFOLIO_POSITIONS_FAILED,
                data: error
            })
        }
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
        try {
            const response = await firstValueFrom(
                this.client.get<WalletTradeToken[]>('wallet/trades/tokens', {
                    params: { address, unit, page, perPage }
                })
            );
            return response.data;
        } catch (error) {
            console.error('TaptoolsService::getWalletTokenTrades error:', error);
            throw new BadRequestException({
                message: 'Get wallet token trades failed',
                validatorErrors: EError.TAPTOOLS_GET_WALLET_TOKEN_TRADES_FAILED,
                data: error
            })
        }
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
        try {
            const response = await firstValueFrom(
                this.client.get<WalletValueTrended[]>('wallet/value/trended', {
                    params: { address, timeframe, quote }
                })
            );
            return response.data;
        } catch (error) {
            console.error('TaptoolsService::getWalletValueTrended error:', error);
            throw new BadRequestException({
                message: 'Get wallet value trended failed',
                validatorErrors: EError.TAPTOOLS_GET_WALLET_VALUE_TRENDED_FAILED,
                data: error
            })
        }
    }

    // Onchain Endpoints

    /**
     * Get asset supply
     * @param unit - Token unit (policy + hex name)
     * @returns Promise with asset supply
     */
    async getAssetSupply(unit: string): Promise<{ supply: number }> {
        try {
            const response = await firstValueFrom(
                this.client.get<{ supply: number }>('assets/supply', { params: { unit } })
            );
            return response.data;
        } catch (error) {
            console.error('TaptoolsService::getAssetSupply error:', error);
            throw new BadRequestException({
                message: 'Get asset supply failed',
                validatorErrors: EError.TAPTOOLS_GET_ASSET_SUPPLY_FAILED,
                data: error
            })
        }
    }

    /**
     * Get address information
     * @param address - Cardano address
     * @returns Promise with address information
     */
    async getAddressInfo({
        address,
        paymentCred
    }: {
        address?: string;
        paymentCred?: string;
    }): Promise<AddressInfo> {
        try {
            const response = await firstValueFrom(
                this.client.get<AddressInfo>('address/info', { params: { address, paymentCred } })
            );
            return response.data;
        } catch (error) {
            console.error('TaptoolsService::getAddressInfo error:', error.response.data);
            throw new BadRequestException({
                message: 'Get address info failed',
                validatorErrors: EError.TAPTOOLS_GET_ADDRESS_INFO_FAILED,
                data: error
            })
        }
    }

    /**
     * Get address UTXOs
     * @param address - Cardano address
     * @param page - Page number (default: 1)
     * @param perPage - Items per page (default: 100, max: 100)
     * @returns Promise with address UTXOs
     */
    async getAddressUTXOs(address: string, page = 1, perPage = 100): Promise<AddressUtxo[]> {
        try {
            const response = await firstValueFrom(
                this.client.get<AddressUtxo[]>('address/utxos', { params: { address, page, perPage } })
            );
            return response.data;
        } catch (error) {
            console.error('TaptoolsService::getAddressUTXOs error:', error);
            throw new BadRequestException({
                message: 'Get address UTXOs failed',
                validatorErrors: EError.TAPTOOLS_GET_ADDRESS_UTXOS_FAILED,
                data: error
            })
        }
    }

    // Market Endpoints

    /**
     * Get market stats
     * @param quote - Quote currency (default: ADA)
     * @returns Promise with market stats
     */
    async getMarketStats(quote = 'ADA'): Promise<{ activeAddresses: number; dexVolume: number }> {
        try {
            const response = await firstValueFrom(
                this.client.get<{ activeAddresses: number; dexVolume: number }>('market/stats', { params: { quote } })
            );
            return response.data;
        } catch (error) {
            console.error('TaptoolsService::getMarketStats error:', error);
            throw new BadRequestException({
                message: 'Get market stats failed',
                validatorErrors: EError.TAPTOOLS_GET_MARKET_STATS_FAILED,
                data: error
            })
        }
    }
}