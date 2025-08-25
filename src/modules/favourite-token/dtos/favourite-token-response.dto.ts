export type SavedToken = {
  id: string;
  name: string;
  ticker: string;
};

export class GetSavedTokensResponseDto {
  savedTokens: SavedToken[];
}

export class ToggleFavouriteResponseDto {
  isFavourite: boolean;
}

export class CheckFavouriteResponseDto {
  favourites: { [tokenId: string]: boolean };
}
