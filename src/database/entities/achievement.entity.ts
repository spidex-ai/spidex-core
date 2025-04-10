import { BaseEntity } from "@database/common/base.entity";
import { Column, Entity } from "typeorm";

export enum EAchievementStatus {
    ACTIVE = 1,
    INACTIVE = 0,
}

@Entity('achievements')
export class AchievementEntity extends BaseEntity {
    @Column({ type: 'varchar', name: 'name', nullable: false })
    name: string;

    @Column({ type: 'varchar', name: 'icon', nullable: false })
    icon: string;

    @Column({ type: 'decimal', name: 'points', nullable: false })
    points: number;

    @Column({ type: 'enum', name: 'status', enum: EAchievementStatus, nullable: false })
    status: EAchievementStatus;

    @Column({ type: 'varchar', name: 'description', nullable: true })
    description: string;
} 