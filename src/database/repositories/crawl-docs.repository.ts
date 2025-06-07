import { BaseRepository } from '@database/common/base.repository';
import { CrawlDocsEntity } from '@database/entities/crawl-docs.entity';
import { EntityRepository } from 'nestjs-typeorm-custom-repository';

@EntityRepository(CrawlDocsEntity)
export class CrawlDocsRepository extends BaseRepository<CrawlDocsEntity> {}
