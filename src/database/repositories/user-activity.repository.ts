import { BaseRepository } from '@database/common/base.repository';
import { UserActivityEntity } from '@database/entities/user-activity.entity';
import { EntityRepository } from 'nestjs-typeorm-custom-repository';

@EntityRepository(UserActivityEntity)
export class UserActivityRepository extends BaseRepository<UserActivityEntity> {}
