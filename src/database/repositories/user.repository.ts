import { BaseRepository } from '@database/common/base.repository';
import { UserEntity } from '@database/entities/user.entity';
import { PageOptionsWithSearchDto } from '@shared/dtos/page-option-with-search.dto';
import { getSkip } from '@shared/utils/util';
import { EntityRepository } from 'nestjs-typeorm-custom-repository';

@EntityRepository(UserEntity)
export class UserRepository extends BaseRepository<UserEntity> {
  async getUserById(userId: number) {
    return this.findOneBy({ id: userId });
  }

  async getUsers(payload: PageOptionsWithSearchDto) {
    const { keyword, limit, orderBy, direction } = payload;
    const qb = this.createQueryBuilder('user')
      .select([
        'user.id AS id',
        'user.walletAddress AS wallet_address',
        'user.username AS username',
        'user.bio AS bio',
        'user.avatar AS avatar',
        'user.status AS status',
      ]);

    if (orderBy) {
      qb.orderBy(`user.${orderBy}`, direction);
    }

    if (keyword) {
      this.searchByString({ query: qb, searchString: keyword, columnNames: ['user.username', 'user.walletAddress'] });
    }

    qb.offset(getSkip(payload)).limit(limit);

    return Promise.all([
      qb.getRawMany<{
        id: number;
        wallet_address: string;
        username: string;
        bio: string;
        avatar: string;
        status: string;
      }>(),
      qb.getCount(),
    ]);
  }
}
