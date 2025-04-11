import { Controller, Get, Query } from "@nestjs/common";
import { TokenService } from "./token.service";
import { ApiQuery, ApiTags } from "@nestjs/swagger";
import { GuardPublic } from "@shared/decorators/auth.decorator";

@Controller('tokens')
@ApiTags('Tokens')
export class TokenController {
    constructor(private readonly tokenService: TokenService) { }

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

}