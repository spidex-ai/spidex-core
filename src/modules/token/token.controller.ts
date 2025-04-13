import { Controller, Get, Param, Query } from "@nestjs/common";
import { TokenService } from "./token.service";
import { ApiParam, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { GuardPublic } from "@shared/decorators/auth.decorator";
import { TokenStatsResponse } from "@modules/token/dtos/token-response.dto";
import { TokenSearchRequest, TokenTopTradersRequest } from "@modules/token/dtos/token-request.dto";

@Controller('tokens')
@ApiTags('Tokens')
export class TokenController {
    constructor(private readonly tokenService: TokenService) { }

    @Get('search')
    @GuardPublic()
    @ApiQuery({ name: 'query', type: String, required: true, description: 'Query to search for' })
    async searchTokens(@Query() request: TokenSearchRequest) {
        return this.tokenService.searchTokens(request);
    }



    @Get('top/mcap')
    @GuardPublic()
    @ApiQuery({ name: 'limit', type: Number, required: false, description: 'Limit of tokens to return' })
    @ApiQuery({ name: 'page', type: Number, required: false, description: 'Page number' })
    async getTopMcapTokens(@Query('limit') limit: number = 10, @Query('page') page: number = 1) {
        return this.tokenService.getTopMcapTokens(limit, page);
    }

    @Get('top/volume')
    @GuardPublic()
    @ApiQuery({ name: 'timeFrame', type: String, required: false, description: 'Time frame to get top volume tokens' })
    @ApiQuery({ name: 'limit', type: Number, required: false, description: 'Limit of tokens to return' })
    @ApiQuery({ name: 'page', type: Number, required: false, description: 'Page number' })
    async getTopVolumeTokens(@Query('timeFrame') timeFrame: string = '24h', @Query('limit') limit: number = 10, @Query('page') page: number = 1) {
        return this.tokenService.getTopVolumeTokens(timeFrame, limit, page);
    }

    @Get(':tokenId/stats')
    @GuardPublic()
    @ApiParam({ name: 'tokenId', type: String, required: true, description: 'Token ID' })
    @ApiResponse({
        status: 200,
        description: 'Token stats',
        type: TokenStatsResponse
    })
    async getTokenStats(@Param('tokenId') tokenId: string): Promise<TokenStatsResponse> {
        return this.tokenService.getTokenStats(tokenId);
    }

    @Get(':tokenId/trades')
    @GuardPublic()
    @ApiParam({ name: 'tokenId', type: String, required: true, description: 'Token ID' })
    @ApiQuery({ name: 'limit', type: Number, required: false, description: 'Limit of trades to return' })
    @ApiQuery({ name: 'page', type: Number, required: false, description: 'Page number' })
    async getTokenTrades(@Param('tokenId') tokenId: string, @Query('timeFrame') timeFrame: string = '24h', @Query('limit') limit: number = 10, @Query('page') page: number = 1) {
        return this.tokenService.getTokenTrades(tokenId, timeFrame, limit, page);
    }

    @Get(':tokenId/top-holders')
    @GuardPublic()
    @ApiParam({ name: 'tokenId', type: String, required: true, description: 'Token ID' })
    async getTokenTopHolders(@Param('tokenId') tokenId: string, @Query('limit') limit: number = 10, @Query('page') page: number = 1) {
        return this.tokenService.getTopHolders(tokenId, limit, page);
    }

    @Get(':tokenId/top-traders')
    @GuardPublic()
    @ApiParam({ name: 'tokenId', type: String, required: true, description: 'Token ID' })
    async getTokenTopTraders(@Param('tokenId') tokenId: string, @Query() request: TokenTopTradersRequest) {
        return this.tokenService.getTopTraders(tokenId, request);
    }
}