import { EError } from '@constants/error.constant';
import { BaseRepository } from '@database/common/base.repository';
import { SystemConfigEntity, SystemConfigKey } from '@database/entities/system-config.entity';
import { HttpStatus } from '@nestjs/common';
import { BadRequestException } from '@shared/exception';
import { EntityRepository } from 'nestjs-typeorm-custom-repository';

@EntityRepository(SystemConfigEntity)
export class SystemConfigRepository extends BaseRepository<SystemConfigEntity> {
    async findByKey(key: SystemConfigKey): Promise<SystemConfigEntity> {
        return this.findOne({ where: { key } });
    }

    async findByKeyOrThrow(key: SystemConfigKey): Promise<SystemConfigEntity> {
        const config = await this.findByKey(key);
        if (!config) {
            throw new BadRequestException({
                statusCode: HttpStatus.NOT_FOUND,
                message: `System config with key ${key} not found`,
                validatorErrors: EError.SYSTEM_CONFIG_NOT_FOUND,
            });
        }
        return config;
    }
} 