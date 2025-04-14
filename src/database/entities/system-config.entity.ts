import { BaseExcludeDeletedAtEntity } from "@database/common/base.entity";
import { Column, Entity, Index } from "typeorm";

export enum SystemConfigKey {
    USD_TO_POINT = 'usd_to_point',
    REFERRAL_POINT_RATE = 'referral_point_rate',
}

@Entity('system_config')
export class SystemConfigEntity extends BaseExcludeDeletedAtEntity {
    @Index({ unique: true })
    @Column({ unique: true, type: 'varchar' })
    key: string;

    @Column({ type: 'jsonb' })
    value: Record<string, unknown> | string;

    @Column({ nullable: true })
    description?: string;
}