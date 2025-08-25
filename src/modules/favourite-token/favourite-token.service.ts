import { FavouriteTokenRepository } from '@database/repositories/favourite-token.repository';
import { TokenMetaService } from '@modules/token-metadata/token-meta.service';
import { Injectable } from '@nestjs/common';
import { CheckFavouriteDto } from './dtos/favourite-token-request.dto';
import {
  CheckFavouriteResponseDto,
  GetSavedTokensResponseDto,
  ToggleFavouriteResponseDto,
} from './dtos/favourite-token-response.dto';

@Injectable()
export class FavouriteTokenService {
  constructor(
    private readonly favouriteTokenRepository: FavouriteTokenRepository,
    private readonly tokenMetaService: TokenMetaService,
  ) {}

  async getSavedTokensByUserId(userId: number): Promise<GetSavedTokensResponseDto> {
    const favouriteTokens = await this.favouriteTokenRepository.getFavouriteTokensByUserId(userId);

    const tokenIds = favouriteTokens.map(token => token.tokenId);

    const metadata = await this.tokenMetaService.getTokensMetadata(new Set(tokenIds), new Set(['ticker', 'name']));

    const savedTokens = tokenIds.map(tokenId => ({
      id: tokenId,
      name: metadata[tokenId]?.name || tokenId,
      ticker: metadata[tokenId]?.ticker || tokenId,
    }));

    return { savedTokens };
  }

  async toggleFavourite(userId: number, tokenId: string): Promise<ToggleFavouriteResponseDto> {
    const isFavourite = await this.favouriteTokenRepository.toggleFavourite(userId, tokenId);

    return { isFavourite };
  }

  async checkTokensAreFavourite(userId: number, payload: CheckFavouriteDto): Promise<CheckFavouriteResponseDto> {
    const favourites = await this.favouriteTokenRepository.checkMultipleTokensAreFavourite(userId, payload.tokenIds);

    return { favourites };
  }
}
