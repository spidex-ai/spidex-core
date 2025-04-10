import { BaseRepository } from '@database/common/base.repository';
import { UserReferralEntity } from '@database/entities/user-referral.entity';
import { EntityRepository } from 'nestjs-typeorm-custom-repository';

@EntityRepository(UserReferralEntity)
export class UserReferralRepository extends BaseRepository<UserReferralEntity> { }
