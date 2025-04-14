import { SystemConfigEntity } from '@database/entities/system-config.entity';
import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import systemConfigData from '../data-seed/system-config.seed.json';
export default class SystemConfigSeeder implements Seeder {
    public async run(dataSource: DataSource): Promise<any> {
        const repository = dataSource.getRepository(SystemConfigEntity);
        const systemConfigs = systemConfigData.map(config => repository.create(config));
        await repository.upsert(systemConfigs, {
            conflictPaths: ['key'],
            skipUpdateIfNoValuesChanged: true,
        });
    }
}
