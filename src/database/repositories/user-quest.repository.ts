import { BaseRepository } from '@database/common/base.repository';
import { UserQuestEntity } from '@database/entities/user-quest.entity';
import { EntityRepository } from 'nestjs-typeorm-custom-repository';

@EntityRepository(UserQuestEntity)
export class UserQuestRepository extends BaseRepository<UserQuestEntity> {}
