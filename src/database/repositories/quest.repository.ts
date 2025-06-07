import { BaseRepository } from '@database/common/base.repository';
import { QuestEntity } from '@database/entities/quest.entity';
import { EntityRepository } from 'nestjs-typeorm-custom-repository';

@EntityRepository(QuestEntity)
export class QuestRepository extends BaseRepository<QuestEntity> {}
