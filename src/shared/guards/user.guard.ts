import { CanActivate, ExecutionContext, Inject } from '@nestjs/common';

import { EError } from '@constants/error.constant';
import { EUserStatus } from '@constants/user.constant';
import { UserEntity } from '@database/entities/user.entity';
import { BadRequestException, Unauthorized } from '@shared/exception';
import { IJwtPayload, IJwtPayloadAdmin } from '@shared/interfaces/auth.interface';
import { DataSource } from 'typeorm';
import { AdminEntity } from '@database/entities/admin.entity';

export class UserGuard implements CanActivate {
  constructor(@Inject(DataSource) private readonly dataSource: DataSource) {}

  async canActivate(context: ExecutionContext) {
    const { user } = context.switchToHttp().getRequest() as {
      user: IJwtPayload;
    };

    if (!user) {
      throw new Unauthorized({
        validatorErrors: EError.UNAUTHORIZED,
      });
    }

    const checkMember = await this.checkMember(user.userId);

    return checkMember;
  }

  async checkMember(userId: number) {
    const currentUser = await this.dataSource.getRepository(UserEntity).findOne({
      where: { id: userId },
      select: ['id', 'status'],
    });

    if (!currentUser) throw new Unauthorized({ validatorErrors: EError.USER_NOT_EXIST });

    if (currentUser.status === EUserStatus.INACTIVE)
      throw new BadRequestException({
        validatorErrors: EError.USER_DEACTIVATED,
      });

    return true;
  }
}

export class AdminGuard implements CanActivate {
  constructor(@Inject(DataSource) private readonly dataSource: DataSource) {}

  async canActivate(context: ExecutionContext) {
    const { user } = context.switchToHttp().getRequest() as {
      user: IJwtPayloadAdmin;
    };
    console.log('🚀 ~ AdminGuard ~ const{admin}=context.switchToHttp ~ admin:', user);

    if (!user) {
      throw new Unauthorized({
        validatorErrors: EError.UNAUTHORIZED,
      });
    }

    const checkMember = await this.checkMember(user.adminId);

    return checkMember;
  }

  async checkMember(adminId: number) {
    const currentUser = await this.dataSource.getRepository(AdminEntity).findOne({
      where: { id: adminId },
    });

    if (!currentUser) throw new Unauthorized({ validatorErrors: EError.USER_NOT_EXIST });

    if (currentUser.isActive === false)
      throw new BadRequestException({
        validatorErrors: EError.USER_DEACTIVATED,
      });

    return true;
  }
}
