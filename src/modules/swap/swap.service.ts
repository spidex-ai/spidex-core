import { CARDANO_LOVELACE_UNIT, CARDANO_NAME, CARDANO_UNIT, LOVELACE_TO_ADA_RATIO } from '@constants/cardano.constant';
import { EEnvKey } from '@constants/env.constant';
import { EError } from '@constants/error.constant';
import {
  SwapAction,
  SwapExchange,
  SwapStatus,
  SwapTransactionEntity,
} from '@database/entities/swap-transaction.entity';
import { EUserPointLogType } from '@database/entities/user-point-log.entity';
import { SwapTransactionRepository } from '@database/repositories/swap-transaction.repository';
import { Blockfrost, Lucid, LucidEvolution } from '@lucid-evolution/lucid';
import { EventService } from '@modules/event/services/event.service';
import {
  BuildCardexscanSwapRequest,
  BuildDexhunterSwapRequest,
  BuildMinswapSwapRequest,
  CardexscanTokenInfo,
  EstimateSwapRequest,
  GetPoolStatsRequest,
  MinswapTokenDBInfo,
  SubmitSwapRequest,
  TokenDBInfo,
} from '@modules/swap/dtos/swap-request.dto';
import {
  AggregatorEstimateSwapResponse,
  cardexscanProtocolMap,
  dexhunterProtocolMap,
  EstimateSwapResponse,
  minswapProtocolMap,
} from '@modules/swap/dtos/swap-response.dto';
import { SystemConfigService } from '@modules/system-config/system-config.service';
import { TokenMetaService } from '@modules/token-metadata/token-meta.service';
import { TokenPriceService } from '@modules/token-price/token-price.service';
import { UserPointService } from '@modules/user-point/services/user-point.service';
import { EUserPointType } from '@modules/user-point/user-point.constant';
import { UserQuestService } from '@modules/user-quest/services/user-quest.service';
import { forwardRef, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@shared/exception';
import { generateRandomCbor, getTxHashFromCbor } from '@shared/utils/cardano';
import { toHexString } from '@shared/utils/string';
import Decimal from 'decimal.js';
import { BlockfrostService } from 'external/blockfrost/blockfrost.service';
import { CardexscanService } from 'external/cardexscan/cardexscan.service';
import { CardexscanEstimateSwapResponse, CardexscanToken } from 'external/cardexscan/types';
import { DexhunterService } from 'external/dexhunter/dexhunter.service';
import { DexHunterEsitmateSwapResponse } from 'external/dexhunter/types';
import { DHAPIService } from 'external/dhapi/dhapi.service';
import { MinswapService } from 'external/minswap/minswap.service';
import { MinswapEsitmateSwapResponse } from 'external/minswap/types';
import { TaptoolsService } from 'external/taptools/taptools.service';
import { reduce } from 'lodash';
import { Transactional } from 'typeorm-transactional';
@Injectable()
export class SwapService implements OnModuleInit {
  private readonly logger = new Logger(SwapService.name);
  private lucid: LucidEvolution;
  private readonly ADA_DECIMALS = new Decimal(6);
  constructor(
    private readonly dexhunterService: DexhunterService,
    private readonly minswapService: MinswapService,
    private readonly cardexscanService: CardexscanService,
    private readonly blockfrostService: BlockfrostService,
    private readonly swapTransactionRepository: SwapTransactionRepository,
    private readonly tapToolsService: TaptoolsService,
    private readonly systemConfigService: SystemConfigService,
    private readonly tokenPriceService: TokenPriceService,
    private readonly tokenMetaService: TokenMetaService,
    @Inject(forwardRef(() => UserPointService))
    private readonly userPointService: UserPointService,
    private readonly userQuestService: UserQuestService,
    @Inject(forwardRef(() => EventService))
    private readonly eventService: EventService,
    private readonly configService: ConfigService,
    private readonly dhapiService: DHAPIService,
  ) {}
  async onModuleInit() {
    this.lucid = await Lucid(
      new Blockfrost(
        this.configService.get(EEnvKey.BLOCKFROST_API_URL),
        this.configService.get(EEnvKey.BLOCKFROST_API_KEY),
      ),
      'Mainnet',
    );
  }

  async buildSwapDexhunter(userId: number, payload: BuildDexhunterSwapRequest) {
    try {
      const tokenAUnit = payload.tokenIn;
      const tokenBUnit = payload.tokenOut;
      const adaPrice = await this.tokenPriceService.getAdaPriceInUSD();

      let tokenIn, tokenOut: TokenDBInfo;

      if (payload.tokenIn === CARDANO_UNIT) {
        tokenIn = {
          unit: '',
          name: 'Ada',
          price: adaPrice,
        };
      } else {
        const tokenInPrices = await this.tapToolsService.getTokenPrices([tokenAUnit], false);
        tokenIn = await this.tokenMetaService.getTokenMetadata(tokenAUnit, ['name']);
        tokenIn.price = tokenInPrices[tokenAUnit] * adaPrice;
      }
      if (payload.tokenOut === CARDANO_UNIT) {
        tokenOut = {
          unit: '',
          name: 'Ada',
          price: adaPrice,
        };
      } else {
        const tokenOutPrices = await this.tapToolsService.getTokenPrices([tokenBUnit], false);
        const tokenOutMetadata = await this.tokenMetaService.getTokenMetadata(tokenBUnit, ['name']);
        tokenOut = {
          unit: tokenBUnit,
          name: tokenOutMetadata.name,
          price: tokenOutPrices[tokenBUnit] * adaPrice,
        };
      }

      const mainAddress = payload.addresses[0];

      await this.dhapiService.swapWallet({
        addresses: payload.addresses,
      });

      const response = await this.dexhunterService.buildSwap({
        buyer_address: mainAddress,
        token_in: tokenIn.unit,
        token_out: tokenOut.unit,
        amount_in: payload.amountIn,
        slippage: payload.slippage || 0.01,
        tx_optimization: payload.txOptimization || true,
        blacklisted_dexes: payload.blacklistedDexes || [],
      });

      const txHash = getTxHashFromCbor(response.cbor);

      const swapSellTx = this.swapTransactionRepository.create({
        userId: userId,
        address: mainAddress,
        tokenA: payload.tokenIn,
        tokenAName: tokenIn.name,
        tokenB: payload.tokenOut,
        tokenBName: tokenOut.name,
        tokenAAmount: new Decimal(payload.amountIn).toString(),
        tokenBAmount: new Decimal(response.total_output).toString(),
        action: SwapAction.SELL,
        timestamp: new Date(),
        exchange: SwapExchange.DEXHUNTER,
        cborHex: response.cbor,
        totalFee: response.total_fee,
        totalUsd: new Decimal(payload.amountIn).times(tokenIn.price).toString(),
        txHash: txHash,
      });

      const swapBuyTx = this.swapTransactionRepository.create({
        userId: userId,
        address: mainAddress,
        tokenA: payload.tokenOut,
        tokenAName: tokenOut.name,
        tokenB: payload.tokenIn,
        tokenBName: tokenIn.name,
        tokenAAmount: new Decimal(response.total_output).toString(),
        tokenBAmount: new Decimal(payload.amountIn).toString(),
        action: SwapAction.BUY,
        timestamp: new Date(),
        exchange: SwapExchange.DEXHUNTER,
        cborHex: response.cbor,
        totalFee: response.total_fee,
        totalUsd: new Decimal(response.total_output).times(tokenOut.price).toString(),
        txHash: txHash,
      });

      await this.swapTransactionRepository.save([swapSellTx, swapBuyTx]);

      return { cbor: response.cbor, txHash: txHash };
    } catch (error) {
      this.logger.error(`Failed to build swap: ${error}`, error.stack);
      throw new BadRequestException({
        message: 'Failed to build swap',
        data: error.response.data,
        validatorErrors: EError.DEXHUNTER_BUILD_SWAP_FAILED,
      });
    }
  }

  async buildSwapMinswap(userId: number, payload: BuildMinswapSwapRequest) {
    try {
      const {
        sender,
        min_amount_out,
        estimate: { amount, token_in, token_out, slippage },
      } = payload;
      const tokenAUnit = token_in;
      const tokenBUnit = token_out;
      const adaPrice = await this.tokenPriceService.getAdaPriceInUSD();

      let tokenIn: MinswapTokenDBInfo, tokenOut: MinswapTokenDBInfo;

      if (token_in === CARDANO_UNIT) {
        tokenIn = {
          unit: '',
          name: CARDANO_NAME,
          price: adaPrice,
          unitSwap: CARDANO_LOVELACE_UNIT,
        };
      } else {
        const tokenInPrices = await this.tapToolsService.getTokenPrices([tokenAUnit], false);
        const tokenInMetadata = await this.tokenMetaService.getTokenMetadata(tokenAUnit, ['name']);
        tokenIn = {
          unit: tokenInMetadata.unit,
          name: tokenInMetadata.name,
          price: tokenInPrices[tokenAUnit] * adaPrice,
          unitSwap: tokenAUnit,
        };
      }
      if (token_out === CARDANO_UNIT) {
        tokenOut = {
          unit: '',
          name: CARDANO_NAME,
          price: adaPrice,
          unitSwap: CARDANO_LOVELACE_UNIT,
        };
      } else {
        const tokenOutPrices = await this.tapToolsService.getTokenPrices([tokenBUnit], false);
        const tokenOutMetadata = await this.tokenMetaService.getTokenMetadata(tokenBUnit, ['name']);
        tokenOut = {
          unit: tokenOutMetadata.unit,
          name: tokenOutMetadata.name,
          price: tokenOutPrices[tokenBUnit] * adaPrice,
          unitSwap: tokenBUnit,
        };
      }

      const response = await this.minswapService.buildSwap({
        sender: sender,
        min_amount_out: new Decimal(min_amount_out).mul(LOVELACE_TO_ADA_RATIO).toString(),
        estimate: {
          amount: new Decimal(amount).mul(LOVELACE_TO_ADA_RATIO).toString(),
          token_in: tokenIn.unitSwap,
          token_out: tokenOut.unitSwap,
          slippage: slippage,
          exclude_protocols: [],
          allow_multi_hops: true,
          partner: this.configService.get<string>(EEnvKey.MINSWAP_PARTNER_ID),
        },
      });

      const txHash = getTxHashFromCbor(response.cbor);

      const swapSellTx = this.swapTransactionRepository.create({
        userId: userId,
        address: sender,
        tokenA: token_in,
        tokenAName: tokenIn.name,
        tokenB: token_out,
        tokenBName: tokenOut.name,
        tokenAAmount: amount,
        tokenBAmount: min_amount_out,
        action: SwapAction.SELL,
        timestamp: new Date(),
        exchange: SwapExchange.MINSWAP,
        cborHex: response.cbor,
        totalFee: 0,
        totalUsd: new Decimal(amount).times(tokenIn.price).toString(),
        txHash: txHash,
      });

      const swapBuyTx = this.swapTransactionRepository.create({
        userId: userId,
        address: sender,
        tokenA: token_out,
        tokenAName: tokenOut.name,
        tokenB: token_in,
        tokenBName: tokenIn.name,
        tokenAAmount: min_amount_out,
        tokenBAmount: amount,
        action: SwapAction.BUY,
        timestamp: new Date(),
        exchange: SwapExchange.MINSWAP,
        cborHex: response.cbor,
        totalFee: 0,
        totalUsd: new Decimal(min_amount_out).times(tokenOut.price).toString(),
        txHash: txHash,
      });

      await this.swapTransactionRepository.save([swapSellTx, swapBuyTx]);

      return { cbor: response.cbor, txHash: txHash };
    } catch (error) {
      this.logger.error(`Failed to build swap: ${error}`, error.stack);
      throw new BadRequestException({
        message: 'Failed to build swap',
        data: error.response.data,
        validatorErrors: EError.MINSWAP_BUILD_SWAP_FAILED,
      });
    }
  }

  async buildSwapCardexscan(userId: number, payload: BuildCardexscanSwapRequest) {
    try {
      const adaPrice = await this.tokenPriceService.getAdaPriceInUSD();

      let cardexscanTokenIn: CardexscanTokenInfo, cardexscanTokenOut: CardexscanTokenInfo;
      let tokenIn: TokenDBInfo, tokenOut: TokenDBInfo;

      if (payload.tokenIn === CARDANO_UNIT) {
        cardexscanTokenIn = CARDANO_LOVELACE_UNIT;
        tokenIn = {
          unit: CARDANO_LOVELACE_UNIT,
          name: 'Ada',
          price: adaPrice,
        };
      } else {
        const tokenInPrice = await this.tapToolsService.getTokenPrices([payload.tokenIn], false);
        const tokenInMetadata = await this.tokenMetaService.getTokenMetadata(payload.tokenIn, [
          'name',
          'ticker',
          'policy',
        ]);
        cardexscanTokenIn = {
          policyId: tokenInMetadata.policy,
          nameHex: toHexString(tokenInMetadata.name.toUpperCase()),
          ticker: tokenInMetadata.ticker,
        } as CardexscanToken;

        tokenIn = {
          unit: tokenInMetadata.ticker,
          name: tokenInMetadata.name,
          price: tokenInPrice[payload.tokenIn] * adaPrice,
        };
      }

      if (payload.tokenOut === CARDANO_UNIT) {
        cardexscanTokenOut = CARDANO_LOVELACE_UNIT;
      } else {
        const tokenOutMetadata = await this.tokenMetaService.getTokenMetadata(payload.tokenOut, [
          'name',
          'ticker',
          'policy',
        ]);
        const tokenOutPrice = await this.tapToolsService.getTokenPrices([payload.tokenOut], false);
        cardexscanTokenOut = {
          policyId: tokenOutMetadata.policy,
          nameHex: toHexString(tokenOutMetadata.name.toUpperCase()),
          ticker: tokenOutMetadata.ticker,
        } as CardexscanToken;

        tokenOut = {
          unit: tokenOutMetadata.ticker,
          name: tokenOutMetadata.name,
          price: tokenOutPrice[payload.tokenOut] * adaPrice,
        };
      }

      const estimatedSwap = await this.cardexscanService.estimateSwap({
        tokenInAmount: payload.tokenInAmount,
        slippage: payload.slippage || 1,
        tokenIn: cardexscanTokenIn,
        tokenOut: cardexscanTokenOut,
        blacklisted_dexes: [],
      });

      const response = await this.cardexscanService.buildSwap({
        tokenInAmount: payload.tokenInAmount,
        slippage: payload.slippage || 1,
        tokenIn: cardexscanTokenIn,
        tokenOut: cardexscanTokenOut,
        blacklisted_dexes: [],
        userAddress: payload.sender,
      });

      const txHash = getTxHashFromCbor(response.data.txCbor);

      const swapSellTx = this.swapTransactionRepository.create({
        userId: userId,
        address: payload.sender,
        tokenA: payload.tokenIn,
        tokenAName: tokenIn.name,
        tokenB: payload.tokenOut,
        tokenBName: tokenOut.name,
        tokenAAmount: new Decimal(payload.tokenInAmount).toString(),
        tokenBAmount: new Decimal(estimatedSwap.data.estimatedTotalRecieve).toString(),
        action: SwapAction.SELL,
        timestamp: new Date(),
        exchange: SwapExchange.CARDEXSCAN,
        cborHex: response.data.txCbor,
        totalFee: 0,
        totalUsd: new Decimal(payload.tokenInAmount).times(tokenIn.price).toString(),
        txHash: txHash,
      });

      const swapBuyTx = this.swapTransactionRepository.create({
        userId: userId,
        address: payload.sender,
        tokenA: payload.tokenOut,
        tokenAName: tokenOut.name,
        tokenB: payload.tokenIn,
        tokenBName: tokenIn.name,
        tokenAAmount: new Decimal(estimatedSwap.data.estimatedTotalRecieve).toString(),
        tokenBAmount: new Decimal(payload.tokenInAmount).toString(),
        action: SwapAction.BUY,
        timestamp: new Date(),
        exchange: SwapExchange.CARDEXSCAN,
        cborHex: response.data.txCbor,
        totalFee: 0,
        totalUsd: new Decimal(estimatedSwap.data.estimatedTotalRecieve).times(tokenOut.price).toString(),
        txHash: txHash,
      });

      await this.swapTransactionRepository.save([swapSellTx, swapBuyTx]);

      return { cbor: response.data.txCbor, txHash: txHash };
    } catch (error) {
      this.logger.error(`Failed to build Cardexscan swap: ${error}`, error.stack);
      throw new BadRequestException({
        message: 'Failed to build swap',
        data: error.response?.data,
        validatorErrors: EError.CARDEXSCAN_BUILD_SWAP_FAILED,
      });
    }
  }

  async estimateSwap(payload: EstimateSwapRequest): Promise<EstimateSwapResponse> {
    try {
      let tokenInDexHunter: any, tokenOutDexHunter: any;
      let tokenInMinswap: any, tokenOutMinswap: any;
      let tokenInCardexscan: CardexscanTokenInfo, tokenOutCardexscan: CardexscanTokenInfo;
      let tokenInDecimal: Decimal, tokenOutDecimal: Decimal;
      if (payload.tokenIn === 'ADA') {
        tokenInDexHunter = {
          unit: '',
        };
        tokenInMinswap = {
          unit: 'lovelace',
        };
        tokenInCardexscan = 'lovelace';
        tokenInDecimal = new Decimal(6);
      } else {
        tokenInDexHunter = {
          unit: payload.tokenIn,
        };
        tokenInMinswap = {
          unit: payload.tokenIn,
        };
        const tokenInMetadata = await this.tokenMetaService.getTokenMetadata(payload.tokenIn, [
          'name',
          'ticker',
          'policy',
          'nameHex',
          'decimals',
        ]);
        tokenInCardexscan = {
          policyId: tokenInMetadata.policy,
          nameHex: tokenInMetadata.nameHex || toHexString(tokenInMetadata.name.toLowerCase()),
          ticker: tokenInMetadata.ticker,
        };
        tokenInDecimal = new Decimal(tokenInMetadata.decimals || 0);
      }

      if (payload.tokenOut === 'ADA') {
        tokenOutDexHunter = {
          unit: '',
        };
        tokenOutMinswap = {
          unit: 'lovelace',
        };
        tokenOutCardexscan = 'lovelace';
        tokenOutDecimal = new Decimal(6);
      } else {
        tokenOutDexHunter = {
          unit: payload.tokenOut,
        };
        tokenOutMinswap = {
          unit: payload.tokenOut,
        };

        const tokenOutMetadata = await this.tokenMetaService.getTokenMetadata(payload.tokenOut, [
          'name',
          'ticker',
          'policy',
          'nameHex',
          'decimals',
        ]);
        tokenOutCardexscan = {
          policyId: tokenOutMetadata.policy,
          nameHex: tokenOutMetadata.nameHex || toHexString(tokenOutMetadata.name.toLowerCase()),
          ticker: tokenOutMetadata.ticker,
        };
        tokenOutDecimal = new Decimal(tokenOutMetadata.decimals || 0);
      }

      const [dexHunterResp, minswapResp, cardexscanResp, estimatedPoint] = await Promise.allSettled([
        this.dexhunterService.estimateSwap({
          token_in: tokenInDexHunter.unit,
          token_out: tokenOutDexHunter.unit,
          amount_in: payload.amountIn,
          slippage: payload.slippage || 0.01,
          blacklisted_dexes: [],
        }),
        this.minswapService.estimateSwap({
          amount: new Decimal(payload.amountIn).mul(LOVELACE_TO_ADA_RATIO).toString(),
          token_in: tokenInMinswap.unit,
          token_out: tokenOutMinswap.unit,
          slippage: payload.slippage || 0.01,
          exclude_protocols: [],
          allow_multi_hops: true,
          partner: this.configService.get<string>(EEnvKey.MINSWAP_PARTNER_ID),
        }),
        this.cardexscanService.estimateSwap({
          tokenInAmount: payload.amountIn,
          slippage: payload.slippage || 0.01,
          tokenIn: tokenInCardexscan,
          tokenOut: tokenOutCardexscan,
          blacklisted_dexes: [],
        }),
        this.getEstimatedPoint({
          tokenIn: payload.tokenIn,
          amountIn: payload.amountIn,
        }),
      ]);

      return {
        dexhunter:
          dexHunterResp.status === 'fulfilled' ? this.mapDexhunterEsimatedSwapResponse(dexHunterResp.value) : null,
        minswap:
          minswapResp.status === 'fulfilled'
            ? this.mapMinswapEsimatedSwapResponse(
                payload.tokenIn,
                payload.tokenOut,
                new Decimal(payload.amountIn).toString(),
                tokenInDecimal.toString(),
                tokenOutDecimal.toString(),
                minswapResp.value,
              )
            : null,
        cardexscan:
          cardexscanResp.status === 'fulfilled'
            ? this.mapCardexscanEstimatedSwapResponse(
                payload.tokenIn,
                payload.tokenOut,
                new Decimal(payload.amountIn).toString(),
                tokenInDecimal.toString(),
                tokenOutDecimal.toString(),
                cardexscanResp.value,
              )
            : null,
        estimatedPoint: estimatedPoint.status === 'fulfilled' ? estimatedPoint.value : '0',
      };
    } catch (error) {
      this.logger.error(`Failed to estimate swap: ${error}`);
      throw new BadRequestException({
        message: 'Failed to estimate swap',
        data: error.response.data,
        validatorErrors: EError.SWAP_ESTIMATION_FAILED,
      });
    }
  }

  mapDexhunterEsimatedSwapResponse(response: DexHunterEsitmateSwapResponse): AggregatorEstimateSwapResponse {
    return {
      netPrice: response.net_price.toString(),
      minReceive: response.total_output.toString(),
      dexFee: response.partner_fee.toString(),
      dexDeposits: response.deposits.toString(),
      totalDeposits: new Decimal(response.deposits).add(response.partner_fee).add(response.batcher_fee).toString(),
      paths: response.splits.map(split => {
        return {
          protocol: dexhunterProtocolMap[split.dex],
          poolId: split.pool_id,
          amountIn: split.amount_in.toString(),
          amountOut: split.expected_output_without_slippage.toString(),
          minReceive: split.expected_output.toString(),
          priceImpact: split.price_impact,
          batcherFee: split.batcher_fee.toString(),
          refundableDeposits: split.deposits.toString(),
        };
      }),
    };
  }

  fromUnit(amount: string | number | Decimal, decimals: Decimal): Decimal {
    return new Decimal(amount || 0).div(new Decimal(10).pow(decimals));
  }

  mapMinswapEsimatedSwapResponse(
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    tokenInDecimal: string,
    tokenOutDecimal: string,
    response: MinswapEsitmateSwapResponse,
  ): AggregatorEstimateSwapResponse {
    try {
      console.debug('Minswap response:', response, {
        tokenIn,
        tokenOut,
        amountIn,
        tokenInDecimal,
        tokenOutDecimal,
      });
      const inDecimals = new Decimal(tokenInDecimal || this.ADA_DECIMALS);
      const outDecimals = new Decimal(tokenOutDecimal || this.ADA_DECIMALS);

      // convert min receive
      const minReceiveDecimal = this.fromUnit(response.min_amount_out || 0, outDecimals);

      const amountOutDecimal = this.fromUnit(response.amount_out || 0, outDecimals);

      let netPrice: Decimal;

      if (tokenOut === CARDANO_UNIT) {
        netPrice = new Decimal(amountOutDecimal).div(amountIn); // ADA
      } else if (tokenIn === CARDANO_UNIT) {
        netPrice = new Decimal(amountIn).div(amountOutDecimal); // ADA
      } else {
        netPrice = new Decimal(amountIn).div(amountOutDecimal);
      }
      return {
        netPrice: netPrice.toString(),
        minReceive: minReceiveDecimal.toString(),
        dexFee: this.fromUnit(response.total_dex_fee || 0, this.ADA_DECIMALS).toString(),
        dexDeposits: this.fromUnit(response.deposits || 0, this.ADA_DECIMALS).toString(),
        totalDeposits: this.fromUnit(
          new Decimal(response.deposits || 0).add(response.total_dex_fee || 0).add(response.aggregator_fee || 0),
          this.ADA_DECIMALS,
        ).toString(),
        paths: response.paths
          .map(path =>
            path.map(p => {
              const amountIn = this.fromUnit(p.amount_in || 0, inDecimals);
              const amountOut = this.fromUnit(p.amount_out || 0, outDecimals);
              const minReceive = this.fromUnit(p.min_amount_out || 0, outDecimals);

              return {
                protocol: minswapProtocolMap[p.protocol],
                poolId: p.pool_id,
                amountIn: amountIn.toString(),
                amountOut: amountOut.toString(),
                minReceive: minReceive.toString(),
                priceImpact: new Decimal(p.price_impact || 0).toNumber(),
                batcherFee: this.fromUnit(p.dex_fee || 0, this.ADA_DECIMALS).toString(),
                refundableDeposits: this.fromUnit(p.deposits || 0, this.ADA_DECIMALS).toString(),
              };
            }),
          )
          .flat(),
      };
    } catch (error) {
      this.logger.error(`Failed to map minswap response: ${error}`);
      throw new BadRequestException({
        message: 'Failed to map minswap response',
        data: error.response?.data,
        validatorErrors: EError.SWAP_ESTIMATION_FAILED,
      });
    }
  }

  private normalizeCardexAmount(value: any, decimals: Decimal): Decimal {
    if (!value) return new Decimal(0);
    const num = new Decimal(value);

    if (decimals.eq(this.ADA_DECIMALS)) {
      if (num.lt(1e6)) {
        return num;
      } else {
        return this.fromUnit(num, decimals); // convert từ Lovelace
      }
    }

    return this.fromUnit(num, decimals);
  }

  mapCardexscanEstimatedSwapResponse(
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    tokenInDecimal: string,
    tokenOutDecimal: string,
    response: CardexscanEstimateSwapResponse,
  ): AggregatorEstimateSwapResponse {
    try {
      console.debug('Cardexscan response:', response, {
        tokenIn,
        tokenOut,
        amountIn,
        tokenInDecimal,
        tokenOutDecimal,
      });
      const inDecimals = new Decimal(tokenInDecimal || this.ADA_DECIMALS);
      const outDecimals = new Decimal(tokenOutDecimal || this.ADA_DECIMALS);

      const minReceiveDecimal = reduce(
        response.data.splits,
        (sum, split) =>
          sum.add(
            this.normalizeCardexAmount(split.minimumAmount || 0, outDecimals), // convert min receive
          ),
        new Decimal(0),
      );

      const totalDeposits = response.data.splits.reduce(
        (sum, split) => sum + (split.deposits || 0) + (split.batcherFee || 0),
        0,
      );
      const totalRefundableDeposits = response.data.splits.reduce((sum, split) => sum + (split.deposits || 0), 0);

      const amountOutDecimal = this.normalizeCardexAmount(response.data.estimatedTotalRecieve, outDecimals);

      let netPrice: Decimal;

      if (tokenOut === CARDANO_UNIT) {
        netPrice = new Decimal(amountOutDecimal).div(amountIn); // ADA
      } else if (tokenIn === CARDANO_UNIT) {
        netPrice = new Decimal(amountIn).div(amountOutDecimal); // ADA
      } else {
        netPrice = new Decimal(amountIn).div(amountOutDecimal);
      }
      return {
        netPrice: netPrice.toString(),
        minReceive: minReceiveDecimal.toString(),
        dexFee: '0',
        dexDeposits: this.fromUnit(totalRefundableDeposits, this.ADA_DECIMALS).toString(),
        totalDeposits: this.fromUnit(totalDeposits, this.ADA_DECIMALS).toString(),
        paths: response.data.splits.map(split => {
          const amountInPath = this.normalizeCardexAmount(split.amountIn || 0, inDecimals);
          const amountOutPath = this.normalizeCardexAmount(split.estimatedAmount || 0, outDecimals);
          const minReceivePath = this.normalizeCardexAmount(split.minimumAmount || 0, outDecimals);

          return {
            protocol: cardexscanProtocolMap[split.dex],
            poolId: '',
            amountIn: amountInPath.toString(),
            amountOut: amountOutPath.toString(),
            minReceive: minReceivePath.toString(),
            priceImpact: split.priceImpact,
            batcherFee: this.fromUnit(split.batcherFee || 0, this.ADA_DECIMALS).toString(),
            refundableDeposits: this.fromUnit(split.deposits || 0, this.ADA_DECIMALS).toString(),
          };
        }),
      };
    } catch (error) {
      this.logger.error(`Failed to map Cardexscan response: ${error}`);
      throw new BadRequestException({
        message: 'Failed to map Cardexscan response',
        data: error.message,
        validatorErrors: EError.CARDEXSCAN_ESTIMATE_SWAP_FAILED,
      });
    }
  }

  @Transactional()
  async submitSwap(userId: number, payload: SubmitSwapRequest) {
    try {
      const txHash = getTxHashFromCbor(payload.txCbor);

      const swapTxs = await this.swapTransactionRepository.findBy({
        txHash: txHash,
      });

      if (swapTxs.length === 0) {
        throw new BadRequestException({
          message: 'Swap transaction not found',
          validatorErrors: EError.SWAP_TRANSACTION_NOT_FOUND,
        });
      }

      if (swapTxs.some(tx => tx.status === SwapStatus.SUCCESS)) {
        throw new BadRequestException({
          message: 'Swap transaction already submitted',
          validatorErrors: EError.SWAP_TRANSACTION_ALREADY_SUBMITTED,
        });
      }

      const swapSellTx = swapTxs.find(tx => tx.action === SwapAction.SELL);
      const swapBuyTx = swapTxs.find(tx => tx.action === SwapAction.BUY);

      if (!swapSellTx || !swapBuyTx) {
        throw new BadRequestException({
          message: 'Swap transaction not found',
          validatorErrors: EError.SWAP_TRANSACTION_NOT_FOUND,
        });
      }

      swapSellTx.status = SwapStatus.SUCCESS;
      swapBuyTx.status = SwapStatus.SUCCESS;

      const point = await this.getEstimatedPoint({
        tokenIn: swapSellTx.tokenA,
        amountIn: new Decimal(swapSellTx.tokenAAmount).toNumber(),
      });

      await this.swapTransactionRepository.save([swapSellTx, swapBuyTx]);
      let submitResponse: any;
      if (swapSellTx.exchange === SwapExchange.MINSWAP) {
        submitResponse = await this.minswapService.submitSwap({
          cbor: payload.txCbor,
          witness_set: payload.signatures,
        });
      } else if (swapSellTx.exchange === SwapExchange.CARDEXSCAN) {
        if (!payload.signedTx) {
          throw new BadRequestException({
            message: 'Signed transaction is required',
            validatorErrors: EError.CARDEXSCAN_SUBMIT_SWAP_FAILED,
          });
        }
        submitResponse = await this.cardexscanService.submitSwap(payload.signedTx);
      } else {
        submitResponse = await this.dexhunterService.submitSwap(payload);
      }

      const MIN_POINT = 0.01;
      if (new Decimal(point).toNumber() >= MIN_POINT) {
        await this.userPointService.emitUserPointChangeEvent({
          userId: userId,
          logType: EUserPointLogType.FROM_CORE,
          amount: point,
          type: EUserPointType.CORE,
        });
      }

      await this.userQuestService.emitUserQuestRelatedTradeEvent({
        userId: userId,
        txHash: txHash,
      });

      // Process trade for active events
      try {
        await this.eventService.emitEventRelatedTrade(swapSellTx);
      } catch (error) {
        this.logger.error(`Failed to process trade for events: ${error.message}`, { txHash, userId });
        // Don't fail the swap submission if event processing fails
      }

      return {
        txHash,
        cbor: submitResponse?.cbor,
      };
    } catch (error) {
      this.logger.error(`Failed to submit swap: ${error}`);
      throw new BadRequestException({
        message: 'Failed to submit swap',
        data: error.response.data,
        validatorErrors: EError.DEXHUNTER_SUBMIT_SWAP_FAILED,
      });
    }
  }

  async getPoolStats(payload: GetPoolStatsRequest) {
    try {
      const response = await this.dexhunterService.poolStats(payload.tokenIn, payload.tokenOut);
      return response;
    } catch (error) {
      this.logger.error(`Failed to get pool stats: ${error}`);
      throw new BadRequestException({
        message: 'Failed to get pool stats',
        data: error.response.data,
        validatorErrors: EError.DEXHUNTER_GET_POOL_STATS_FAILED,
      });
    }
  }

  async getTopTraders(tokenId: string, timeFrame: string = '24h', limit: number = 10, page: number = 1) {
    try {
      const now = new Date();
      let startTime = new Date();
      switch (timeFrame) {
        case '1h':
          startTime.setHours(now.getHours() - 1);
          break;
        case '4h':
          startTime.setHours(now.getHours() - 4);
          break;
        case '12h':
          startTime.setHours(now.getHours() - 12);
          break;
        case '24h':
          startTime.setHours(now.getHours() - 24);
          break;
        case '7d':
          startTime.setDate(now.getDate() - 7);
          break;
        case '30d':
          startTime.setDate(now.getDate() - 30);
          break;
        case 'all':
          startTime = new Date(0); // Beginning of time
          break;
        default:
          startTime.setHours(now.getHours() - 24); // Default to 24h
      }

      // Query to get trading volumes
      const traders = await this.swapTransactionRepository
        .createQueryBuilder('swap')
        .select([
          'swap.address',
          'SUM(CASE WHEN swap.action = :buyAction THEN swap.total_usd ELSE 0 END) as "buyVolume"',
          'SUM(CASE WHEN swap.action = :sellAction THEN swap.total_usd ELSE 0 END) as "sellVolume"',
          'SUM(CASE WHEN swap.action = :buyAction THEN swap.total_usd ELSE -swap.total_usd END) as "netVolume"',
          'SUM(swap.total_usd) as "totalVolume"',
        ])
        .where('(swap.token_a = :tokenId OR swap.token_b = :tokenId)', { tokenId })
        .andWhere('swap.timestamp >= :startTime', { startTime })
        .andWhere('swap.status = :status', { status: SwapStatus.SUCCESS })
        .setParameters({
          buyAction: SwapAction.BUY,
          sellAction: SwapAction.SELL,
        })
        .groupBy('swap.address')
        .orderBy('"totalVolume"', 'DESC')
        .skip((page - 1) * limit)
        .take(limit)
        .getRawMany();

      // Format the response
      return traders.map(trader => ({
        address: trader.swap_address,
        totalVolume: parseFloat(trader.totalVolume),
        buyVolume: parseFloat(trader.buyVolume),
        sellVolume: parseFloat(trader.sellVolume),
        netVolume: parseFloat(trader.netVolume),
      }));
    } catch (error) {
      this.logger.error(`Failed to get top traders: ${error}`);
      throw new BadRequestException({
        message: 'Failed to get top traders',
        data: error.message,
        validatorErrors: EError.GET_TOP_TRADERS_FAILED,
      });
    }
  }

  async getTransactionDetail(txHash: string) {
    const response = await this.blockfrostService.getTransactionDetail(txHash);
    return response;
  }

  async getSellSwapTransaction(txHash: string): Promise<SwapTransactionEntity | null> {
    const response = await this.swapTransactionRepository.findOne({
      where: { txHash, action: SwapAction.SELL, status: SwapStatus.SUCCESS },
    });
    return response;
  }

  async getSwapTransactionByTxHash(txHash: string): Promise<SwapTransactionEntity[] | null> {
    const response = await this.swapTransactionRepository.findBy({ txHash, status: SwapStatus.SUCCESS });
    return response;
  }

  async getTradingVolume(userId: number) {
    const response = await this.swapTransactionRepository
      .createQueryBuilder('swap')
      .where('swap.user_id = :userId', { userId })
      .andWhere('swap.status = :status', { status: SwapStatus.SUCCESS })
      .select('SUM(swap.total_usd) as "totalVolume"')
      .groupBy('swap.user_id')
      .getRawOne();

    return response?.totalVolume || 0;
  }

  async getEstimatedPoint({ tokenIn, amountIn }: { tokenIn: string; amountIn: number }) {
    console.log({ tokenIn, amountIn });
    const [tokenInPrice, adaPriceInUsd, usdToPoint] = await Promise.all([
      this.tapToolsService.getTokenPrices([tokenIn], false),
      this.tokenPriceService.getAdaPriceInUSD(),
      this.systemConfigService.getUsdToPoint(),
    ]);
    console.log({ tokenInPrice, adaPriceInUsd, usdToPoint });
    let tokenInPriceInUsd = 0;
    if (tokenIn === CARDANO_UNIT) {
      tokenInPriceInUsd = adaPriceInUsd * amountIn;
    } else {
      tokenInPriceInUsd = tokenInPrice[tokenIn] * adaPriceInUsd * amountIn;
    }

    const estimatedPoint = new Decimal(tokenInPriceInUsd * usdToPoint).toString();
    return estimatedPoint;
  }

  async getTotalTokenTraded(userId: number, token: string) {
    const query = this.swapTransactionRepository
      .createQueryBuilder('swap')
      .where('swap.user_id = :userId', { userId })
      .andWhere('swap.status = :status', { status: SwapStatus.SUCCESS })
      .andWhere('swap.token_a = :token', { token })
      .select('SUM(swap.token_a_amount) as "totalTokenA"')
      .groupBy('swap.user_id');

    const response = await query.getRawOne();

    const totalToken = new Decimal(response?.totalTokenA || 0).toNumber();
    return totalToken;
  }

  // Simulation methods for testing without real money
  async simulateBuildSwapDexhunter(userId: number, payload: BuildDexhunterSwapRequest) {
    try {
      this.logger.log(`Simulating DexHunter swap build for user ${userId}`);

      const tokenAUnit = payload.tokenIn;
      const tokenBUnit = payload.tokenOut;

      // Get real prices and metadata (keep this real)
      const adaPrice = await this.tokenPriceService.getAdaPriceInUSD();

      let tokenIn: any, tokenOut: any;

      if (payload.tokenIn === 'ADA') {
        tokenIn = {
          unit: '',
          name: 'Ada',
          price: adaPrice,
        };
      } else {
        const tokenInPrices = await this.tapToolsService.getTokenPrices([tokenAUnit], false);
        tokenIn = await this.tokenMetaService.getTokenMetadata(tokenAUnit, ['name']);
        tokenIn.price = tokenInPrices[tokenAUnit] * adaPrice;
      }

      if (payload.tokenOut === 'ADA') {
        tokenOut = {
          unit: '',
          name: 'Ada',
          price: adaPrice,
        };
      } else {
        const tokenOutPrices = await this.tapToolsService.getTokenPrices([tokenBUnit], false);
        tokenOut = await this.tokenMetaService.getTokenMetadata(tokenBUnit, ['name']);
        tokenOut.price = tokenOutPrices[tokenBUnit] * adaPrice;
      }

      // Mock the DexHunter API response instead of calling it
      const mockResponse = {
        cbor: 'mock_tx_cbor_' + Date.now() + '_' + Math.random().toString(36).substring(7),
        routes: [
          {
            protocol: 'MINSWAPV2',
            amount_in: payload.amountIn.toString(),
            amount_out: Math.floor(payload.amountIn * 0.95).toString(),
            fee: '2000000',
            price_impact: '0.05',
          },
        ],
        total_fee: '2000000',
        total_output: Math.floor(payload.amountIn * 0.95).toString(),
        minimum_received: Math.floor(payload.amountIn * 0.9).toString(),
        price_impact: '0.05',
      };

      // Get real user address (keep this real)
      const mainAddress = payload.addresses[0];

      // Create real transaction records (keep this real)
      const txHash = getTxHashFromCbor(mockResponse.cbor);
      const swapSellTx = this.swapTransactionRepository.create({
        userId: userId,
        address: mainAddress,
        tokenA: payload.tokenIn,
        tokenAName: tokenIn.name,
        tokenB: payload.tokenOut,
        tokenBName: tokenOut.name,
        tokenAAmount: new Decimal(payload.amountIn).toString(),
        tokenBAmount: new Decimal(mockResponse.total_output).toString(),
        action: SwapAction.SELL,
        timestamp: new Date(),
        exchange: SwapExchange.DEXHUNTER,
        cborHex: mockResponse.cbor,
        totalFee: parseFloat(mockResponse.total_fee),
        totalUsd: new Decimal(payload.amountIn).times(tokenIn.price).toString(),
        txHash: txHash,
      });

      const swapBuyTx = this.swapTransactionRepository.create({
        userId: userId,
        address: mainAddress,
        tokenA: payload.tokenOut,
        tokenAName: tokenOut.name,
        tokenB: payload.tokenIn,
        tokenBName: tokenIn.name,
        tokenAAmount: new Decimal(mockResponse.total_output).toString(),
        tokenBAmount: new Decimal(payload.amountIn).toString(),
        action: SwapAction.BUY,
        timestamp: new Date(),
        exchange: SwapExchange.DEXHUNTER,
        cborHex: mockResponse.cbor,
        totalFee: parseFloat(mockResponse.total_fee),
        totalUsd: new Decimal(mockResponse.total_output).times(tokenOut.price).toString(),
        txHash: txHash,
      });

      // Save real transaction records
      await this.swapTransactionRepository.save([swapSellTx, swapBuyTx]);

      this.logger.log(`DexHunter simulation completed for user ${userId} with txHash: ${txHash}`);
      return {
        cbor: mockResponse.cbor,
        txHash: txHash,
        simulation: true,
      };
    } catch (error) {
      this.logger.error(`Failed to simulate DexHunter swap: ${error}`, error.stack);
      throw new BadRequestException({
        message: 'Failed to simulate swap build',
        data: error.message,
        validatorErrors: EError.DEXHUNTER_BUILD_SWAP_FAILED,
      });
    }
  }

  async simulateBuildSwapMinswap(userId: number, payload: BuildMinswapSwapRequest) {
    try {
      this.logger.log(`Simulating Minswap swap build for user ${userId}`);

      const {
        sender,
        min_amount_out,
        estimate: { amount, token_in, token_out },
      } = payload;

      const tokenAUnit = token_in;
      const tokenBUnit = token_out;

      // Get real prices and metadata (keep this real)
      const adaPrice = await this.tokenPriceService.getAdaPriceInUSD();

      let tokenIn: MinswapTokenDBInfo, tokenOut: MinswapTokenDBInfo;

      if (token_in === 'ADA') {
        tokenIn = {
          unit: '',
          name: 'Ada',
          price: adaPrice,
          unitSwap: CARDANO_LOVELACE_UNIT,
        };
      } else {
        const tokenInPrices = await this.tapToolsService.getTokenPrices([tokenAUnit], false);
        const tokenInMetadata = await this.tokenMetaService.getTokenMetadata(tokenAUnit, ['name']);
        tokenIn = {
          unit: tokenInMetadata.unit,
          name: tokenInMetadata.name,
          price: tokenInPrices[tokenAUnit] * adaPrice,
          unitSwap: tokenAUnit,
        };
      }

      if (token_out === 'ADA') {
        tokenOut = {
          unit: '',
          name: 'Ada',
          price: adaPrice,
          unitSwap: CARDANO_LOVELACE_UNIT,
        };
      } else {
        const tokenOutPrices = await this.tapToolsService.getTokenPrices([tokenBUnit], false);
        const tokenOutMetadata = await this.tokenMetaService.getTokenMetadata(tokenBUnit, ['name']);
        tokenOut = {
          unit: tokenOutMetadata.unit,
          name: tokenOutMetadata.name,
          price: tokenOutPrices[tokenBUnit] * adaPrice,
          unitSwap: tokenBUnit,
        };
      }

      // Mock the Minswap API response instead of calling it
      const mockResponse = {
        cbor: generateRandomCbor(),
        datum: 'mock_datum_' + Date.now(),
        redeemer: 'mock_redeemer_' + Date.now(),
      };

      // Create real transaction records (keep this real)
      const txHash = getTxHashFromCbor(mockResponse.cbor);
      const swapSellTx = this.swapTransactionRepository.create({
        userId: userId,
        address: sender,
        tokenA: token_in,
        tokenAName: tokenIn.name,
        tokenB: token_out,
        tokenBName: tokenOut.name,
        tokenAAmount: amount,
        tokenBAmount: min_amount_out,
        action: SwapAction.SELL,
        timestamp: new Date(),
        exchange: SwapExchange.MINSWAP,
        cborHex: mockResponse.cbor,
        totalFee: 0,
        totalUsd: new Decimal(amount).times(tokenIn.price).toString(),
        txHash: txHash,
      });

      const swapBuyTx = this.swapTransactionRepository.create({
        userId: userId,
        address: sender,
        tokenA: token_out,
        tokenAName: tokenOut.name,
        tokenB: token_in,
        tokenBName: tokenIn.name,
        tokenAAmount: min_amount_out,
        tokenBAmount: amount,
        action: SwapAction.BUY,
        timestamp: new Date(),
        exchange: SwapExchange.MINSWAP,
        cborHex: mockResponse.cbor,
        totalFee: 0,
        totalUsd: new Decimal(min_amount_out).times(tokenOut.price).toString(),
        txHash: txHash,
      });

      // Save real transaction records
      await this.swapTransactionRepository.save([swapSellTx, swapBuyTx]);

      this.logger.log(`Minswap simulation completed for user ${userId} with txHash: ${txHash}`);
      return {
        cbor: mockResponse.cbor,
        txHash: txHash,
        simulation: true,
      };
    } catch (error) {
      this.logger.error(`Failed to simulate Minswap swap: ${error}`, error.stack);
      throw new BadRequestException({
        message: 'Failed to simulate swap build',
        data: error.message,
        validatorErrors: EError.MINSWAP_BUILD_SWAP_FAILED,
      });
    }
  }

  @Transactional()
  async simulateSubmitSwap(userId: number, payload: SubmitSwapRequest) {
    try {
      this.logger.log(`Simulating swap submission for user ${userId}`);

      // Get real transaction hash from CBOR (keep this real)
      const txHash = getTxHashFromCbor(payload.txCbor);

      // Find real transaction records (keep this real)
      const swapTxs = await this.swapTransactionRepository.findBy({
        txHash: txHash,
      });

      if (swapTxs.length === 0) {
        throw new BadRequestException({
          message: 'Swap transaction not found',
          validatorErrors: EError.SWAP_TRANSACTION_NOT_FOUND,
        });
      }

      if (swapTxs.some(tx => tx.status === SwapStatus.SUCCESS)) {
        throw new BadRequestException({
          message: 'Swap transaction already submitted',
          validatorErrors: EError.SWAP_TRANSACTION_ALREADY_SUBMITTED,
        });
      }

      const swapSellTx = swapTxs.find(tx => tx.action === SwapAction.SELL);
      const swapBuyTx = swapTxs.find(tx => tx.action === SwapAction.BUY);

      if (!swapSellTx || !swapBuyTx) {
        throw new BadRequestException({
          message: 'Swap transaction not found',
          validatorErrors: EError.SWAP_TRANSACTION_NOT_FOUND,
        });
      }

      // Update transaction status to SUCCESS (keep this real)
      swapSellTx.status = SwapStatus.SUCCESS;
      swapBuyTx.status = SwapStatus.SUCCESS;

      // Calculate real points (keep this real)
      const point = await this.getEstimatedPoint({
        tokenIn: swapSellTx.tokenA,
        amountIn: new Decimal(swapSellTx.tokenAAmount).toNumber(),
      });

      // Save updated transaction records (keep this real)
      await this.swapTransactionRepository.save([swapSellTx, swapBuyTx]);

      // Mock the external API call instead of calling real DEX APIs
      const mockSubmitResponse = {
        cbor: payload.txCbor,
        txHash: txHash,
        success: true,
        simulation: true,
      };

      // Add real points (keep this real)
      const MIN_POINT = 0.01;
      if (new Decimal(point).toNumber() >= MIN_POINT) {
        await this.userPointService.emitUserPointChangeEvent({
          userId: userId,
          logType: EUserPointLogType.FROM_CORE,
          amount: point,
          type: EUserPointType.CORE,
        });
      }

      // Emit real quest events (keep this real)
      await this.userQuestService.emitUserQuestRelatedTradeEvent({
        userId: userId,
        txHash: txHash,
      });

      // Process trade for active events (keep this real)
      try {
        await this.eventService.emitEventRelatedTrade(swapSellTx);
      } catch (error) {
        this.logger.error(`Failed to process trade for events: ${error.message}`, { txHash, userId });
        // Don't fail the swap submission if event processing fails
      }

      this.logger.log(`Swap submission simulation completed for user ${userId} with tx: ${txHash}`);
      return {
        txHash,
        cbor: mockSubmitResponse.cbor,
        simulation: true,
        pointsEarned: point,
        message:
          'Simulation completed - transaction records created, points awarded, events processed, but no blockchain transaction submitted',
      };
    } catch (error) {
      this.logger.error(`Failed to simulate swap submission: ${error}`);
      throw new BadRequestException({
        message: 'Failed to simulate swap submission',
        data: error.response?.data || error.message,
        validatorErrors: EError.DEXHUNTER_SUBMIT_SWAP_FAILED,
      });
    }
  }
}
