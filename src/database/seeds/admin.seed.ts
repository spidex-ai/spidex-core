import { AdminEntity, EAdminRole } from "@database/entities/admin.entity";
import { DataSource } from "typeorm";
import { Seeder } from "typeorm-extension";

export default class AdminSeeder implements Seeder {
    public async run(dataSource: DataSource): Promise<any> {
        const repository = dataSource.getRepository(AdminEntity);
   
        // hash password: spidex@tothemoon
        await repository.insert({
            username: 'admin',
            password: '$2b$10$NPH.aMaH3HEhy29Om2acBOjHdWpfVxMa2GzX75Zl0xlqXReqo7NI2',
            name: 'admin',
            role: EAdminRole.SUPER_ADMIN,
            isActive: true,
        });
    }
}
