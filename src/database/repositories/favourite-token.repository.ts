import { EntityRepository } from 'nestjs-typeorm-custom-repository';
import { BaseRepository } from '../common/base.repository';
import { FavouriteTokenEntity } from '../entities/favourite-token.entity';
import { In } from 'typeorm';

@EntityRepository(FavouriteTokenEntity)
export class FavouriteTokenRepository extends BaseRepository<FavouriteTokenEntity> {
  async getFavouriteTokensByUserId(userId: number): Promise<FavouriteTokenEntity[]> {
    return this.findBy({ userId });
  }

  async checkTokenIsFavourite(userId: number, tokenId: string): Promise<boolean> {
    const favourite = await this.findOneBy({ userId, tokenId });
    return !!favourite;
  }

  async checkMultipleTokensAreFavourite(userId: number, tokenIds: string[]): Promise<{ [tokenId: string]: boolean }> {
    const favourites = await this.findBy({
      userId,
      tokenId: In(tokenIds),
    });

    const result: { [tokenId: string]: boolean } = {};
    tokenIds.forEach(tokenId => {
      result[tokenId] = favourites.some(fav => fav.tokenId === tokenId);
    });

    return result;
  }

  async toggleFavourite(userId: number, tokenId: string): Promise<boolean> {
    const existing = await this.findOneBy({ userId, tokenId });

    if (existing) {
      await this.remove(existing);
      return false; // Removed from favourites
    } else {
      const favourite = this.create({
        userId,
        tokenId,
      });
      await this.save(favourite);
      return true; // Added to favourites
    }
  }
}
