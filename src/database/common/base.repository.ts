import { transformQuery } from '@shared/utils/transform-query';
import { Brackets, Repository, SelectQueryBuilder } from 'typeorm';

export class BaseRepository<T extends { id: number }> extends Repository<T> {
  public async findBatch(fromId: number, count: number): Promise<T[]> {
    return this.createQueryBuilder().where('id > :fromId', { fromId }).orderBy('id', 'ASC').take(count).getMany();
  }

  public async getLastId(): Promise<number> {
    const order = {};
    order['id'] = 'DESC';
    const entity = await this.find({ order });

    if (entity?.length) {
      return entity[0].id;
    } else {
      return 0;
    }
  }

  public searchByString({
    query,
    searchString,
    columnNames,
  }: {
    query: SelectQueryBuilder<T>;
    searchString: string;
    columnNames: string[];
  }) {
    if (!searchString || !query) {
      return query;
    }

    query.andWhere(
      new Brackets(qb => {
        for (const item of columnNames) {
          qb.orWhere(`LOWER(${item}) LIKE :searchString`);
        }
      }),
    );

    query.setParameter('searchString', `%${transformQuery(searchString.toString())}%`);

    return query;
  }
}
