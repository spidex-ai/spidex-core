import { BaseRepository } from '@database/common/base.repository';
import { AdminEntity } from '@database/entities/admin.entity';
import { EntityRepository } from 'nestjs-typeorm-custom-repository';

@EntityRepository(AdminEntity)
export class AdminRepository extends BaseRepository<AdminEntity> {}
