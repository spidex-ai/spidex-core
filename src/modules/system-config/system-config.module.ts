import { SystemConfigRepository } from "@database/repositories/system-config.repository";
import { SystemConfigService } from "@modules/system-config/system-config.service";
import { Module } from "@nestjs/common";

import { CustomRepositoryModule } from "nestjs-typeorm-custom-repository";

@Module({
    imports: [CustomRepositoryModule.forFeature([SystemConfigRepository])],
    providers: [SystemConfigService],
    exports: [SystemConfigService],
})
export class SystemConfigModule { }
