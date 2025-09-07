import { BaseRepository } from '@database/common/base.repository';
import { ZealyQuestEntity } from '@database/entities/zealy-quest.entity';
import { EntityRepository } from 'nestjs-typeorm-custom-repository';

@EntityRepository(ZealyQuestEntity)
export class ZealyQuestRepository extends BaseRepository<ZealyQuestEntity> {}