import { LOVELACE_TO_ADA_RATIO } from "@constants/cardano.constant";
import { EEnvKey } from "@constants/env.constant";
import { PortfolioAddressResponse, PortfolioTransactionResponse } from "@modules/portfolio/dtos/portfolio-response.dto";
import { GetPortfolioTransactionsQuery } from "@modules/portfolio/dtos/portfolio.request.dto";
import { TokenMetaService } from "@modules/token-metadata/token-meta.service";
import { TokenPriceService } from "@modules/token-price/token-price.service";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Decimal } from "decimal.js";
import { BlockfrostService } from "external/blockfrost/blockfrost.service";
import { TaptoolsService } from "external/taptools/taptools.service";
import { keyBy } from "lodash";
@Injectable()
export class PortfolioService {
    constructor(
        private readonly blockfrostService: BlockfrostService,
        private readonly taptoolsService: TaptoolsService,
        private readonly tokenPriceService: TokenPriceService,
        private readonly configService: ConfigService,
        private readonly tokenMetaService: TokenMetaService,
    ) { }

    async getPortfolio(address: string): Promise<PortfolioAddressResponse> {
        const addressDetail = await this.blockfrostService.getAddressDetail(address);
        const tokenIds = addressDetail.amount.map(amount => amount.unit).filter(unit => unit !== 'lovelace');
        const [tokenPrices, adaPrice, tokenDetails] = await Promise.all([
            this.taptoolsService.getTokenPrices(tokenIds),
            this.tokenPriceService.getAdaPriceInUSD(),
            this.tokenMetaService.getTokensMetadata(tokenIds, ['name', 'logo', 'ticker']),
        ]);

        const tokenDetailsMap = keyBy(tokenDetails, 'unit');
        const amount = addressDetail.amount.map(amount => {
            if (amount.unit === 'lovelace') {
                const totalPrice = new Decimal(amount.quantity).div(LOVELACE_TO_ADA_RATIO).toNumber();
                const usdTotalPrice = new Decimal(totalPrice).mul(adaPrice).toNumber();
                return {
                    ...amount,
                    quantity: new Decimal(amount.quantity).div(LOVELACE_TO_ADA_RATIO).toString(),
                    price: 1,
                    ticker: 'ADA',
                    name: 'Cardano',
                    totalPrice,
                    usdPrice: adaPrice,
                    usdTotalPrice,
                    logo: `${this.configService.get(EEnvKey.APP_BASE_URL)}/public/icons/tokens/ada.svg`,
                }
            }
            const tokenDetail = tokenDetailsMap[amount.unit];
            return {
                unit: amount.unit,
                quantity: new Decimal(amount.quantity).toString(),
                price: tokenPrices[amount.unit],
                ticker: tokenDetail?.ticker,
                name: tokenDetail?.name,
                totalPrice: new Decimal(amount.quantity).mul(tokenPrices[amount.unit]).toNumber(),
                usdPrice: new Decimal(tokenPrices[amount.unit]).mul(adaPrice).toNumber(),
                usdTotalPrice: new Decimal(amount.quantity).mul(tokenPrices[amount.unit]).mul(adaPrice).toNumber(),
                logo: tokenDetail?.logo,
            }

        }).filter(item => item.logo && item.ticker && item.name);

        return {
            address: addressDetail.address,
            amount,
            stakeAddress: addressDetail.stake_address,
            type: addressDetail.type,
            script: addressDetail.script,
            totalPrice: amount.reduce((acc, curr) => {
                if (curr.unit === 'lovelace') {
                    return acc.plus(curr.totalPrice);
                }
                return acc.plus(curr.totalPrice);
            }, new Decimal(0)).toNumber(),
            totalUsdPrice: amount.reduce((acc, curr) => {
                if (curr.unit === 'lovelace') {
                    return acc.plus(curr.usdTotalPrice);
                }
                return acc.plus(curr.usdTotalPrice);
            }, new Decimal(0)).toNumber(),
        }
    }

    async getTransactions(address: string, query: GetPortfolioTransactionsQuery): Promise<PortfolioTransactionResponse[]> {
        const transactions = await this.blockfrostService.getTransactions(address, query.page, query.count, query.order);
        return transactions.map(transaction => ({
            txHash: transaction.tx_hash,
            txIndex: transaction.tx_index,
            blockHeight: transaction.block_height,
            blockTime: transaction.block_time,
        }));
    }
}