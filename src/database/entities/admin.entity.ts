import { BaseEntity, BaseExcludeDeletedAtEntity } from "@database/common/base.entity";
import { Column, Entity } from "typeorm";
import { IsNotEmpty, IsString, IsBoolean, IsEnum } from 'class-validator';

export enum EAdminRole {
    SUPER_ADMIN = 'SUPER_ADMIN',
    ADMIN = 'ADMIN',
    MODERATOR = 'MODERATOR'
}


@Entity('admins')
export class AdminEntity extends BaseExcludeDeletedAtEntity {
    @Column({ type: 'varchar', name: 'username', nullable: false, unique: true })
    username: string;

    @Column({ type: 'varchar', name: 'password', nullable: false })
    password: string;

    @Column({ type: 'varchar', name: 'name', nullable: true, default: null })
    name: string;

    @Column({ 
        type: 'enum', 
        name: 'role', 
        enum: EAdminRole, 
        nullable: false,
        default: EAdminRole.SUPER_ADMIN 
    })
    @IsEnum(EAdminRole)
    role: EAdminRole;

    @Column({ 
        type: 'boolean', 
        name: 'is_active', 
        nullable: false,
        default: true 
    })
    isActive: boolean;
}