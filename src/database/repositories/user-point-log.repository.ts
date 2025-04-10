import { BaseRepository } from '@database/common/base.repository';
import { UserPointLogEntity } from '@database/entities/user-point-log.entity';
import { EntityRepository } from 'nestjs-typeorm-custom-repository';

@EntityRepository(UserPointLogEntity)
export class UserPointLogRepository extends BaseRepository<UserPointLogEntity> {
    async getMyHistory(userId: number, page: number, limit: number) {
        const [pointLogs, total] = await this.findAndCount({
            where: { userId },
            relations: ['userQuest', 'userQuest.quest'],
            order: {
                createdAt: 'DESC',
            },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { pointLogs, total };
    }
}
