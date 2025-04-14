import { Injectable } from "@nestjs/common";
import { SystemConfigRepository } from "@database/repositories/system-config.repository";
import { SystemConfigKey } from "@database/entities/system-config.entity";

@Injectable()
export class SystemConfigService {
    constructor(
        private readonly systemConfigRepository: SystemConfigRepository,
    ) { }

    async getUsdToPoint(): Promise<number> {
        const config = await this.systemConfigRepository.findByKeyOrThrow(SystemConfigKey.USD_TO_POINT);
        return Number(config.value);
    }

    async getReferralPointRate(): Promise<number> {
        const config = await this.systemConfigRepository.findByKeyOrThrow(SystemConfigKey.REFERRAL_POINT_RATE);
        return Number(config.value);
    }
}
