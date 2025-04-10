import { BaseEntity } from "@database/common/base.entity";
import { Column, Entity, ManyToOne, JoinColumn } from "typeorm";
import { UserEntity } from "./user.entity";
import { AchievementEntity } from "./achievement.entity";

@Entity('user_achievements')
export class UserAchievementEntity extends BaseEntity {
    @Column({ name: 'user_id', type: 'int' })
    userId: number;

    @Column({ name: 'achievement_id', type: 'int' })
    achievementId: number;

    @Column({ name: 'unlocked_at', type: 'timestamp' })
    unlockedAt: Date;

    @ManyToOne(() => UserEntity)
    @JoinColumn({ name: 'user_id' })
    user: UserEntity;

    @ManyToOne(() => AchievementEntity)
    @JoinColumn({ name: 'achievement_id' })
    achievement: AchievementEntity;
} 