import { BaseRepository } from '@database/common/base.repository';
import { ZealyUserQuestEntity } from '@database/entities/zealy-user-quest.entity';
import { EntityRepository } from 'nestjs-typeorm-custom-repository';

@EntityRepository(ZealyUserQuestEntity)
export class ZealyUserQuestRepository extends BaseRepository<ZealyUserQuestEntity> {}