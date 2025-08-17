import { CanActivate, ExecutionContext, Inject } from '@nestjs/common';

import { EError } from '@constants/error.constant';
import { EUserStatus } from '@constants/user.constant';
import { UserEntity } from '@database/entities/user.entity';
import { BadRequestException, Unauthorized } from '@shared/exception';
import { IJwtPayload, IJwtPayloadAdmin } from '@shared/interfaces/auth.interface';
import { DataSource } from 'typeorm';
import { AdminEntity } from '@database/entities/admin.entity';
import { UserActivityTrackingService } from '@shared/services/user-activity-tracking.service';
import { LoggerService } from '@shared/modules/loggers/logger.service';

export class UserGuard implements CanActivate {
  private readonly logger = this.loggerService.getLogger('UserGuard');

  constructor(
    @Inject(DataSource) private readonly dataSource: DataSource,
    private readonly userActivityTrackingService: UserActivityTrackingService,
    private readonly loggerService: LoggerService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const { user } = request as { user: IJwtPayload };

    if (!user) {
      throw new Unauthorized({
        validatorErrors: EError.UNAUTHORIZED,
      });
    }

    const checkMember = await this.checkMember(user.userId);

    if (checkMember) {
      // Track user activity asynchronously (non-blocking)
      this.trackUserActivityAsync(user.userId, request);
    }

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

  /**
   * Track user activity asynchronously without blocking the API request
   */
  private trackUserActivityAsync(userId: number, request: any): void {
    try {
      // Extract relevant information from the request
      const endpoint = request.route?.path || request.url;
      const userAgent = request.headers['user-agent'];
      const ipAddress = request.ip || request.connection?.remoteAddress;

      // Track activity asynchronously
      this.userActivityTrackingService
        .trackUserActivity({
          userId,
          timestamp: new Date(),
          endpoint,
          userAgent,
          ipAddress,
        })
        .catch(error => {
          // Log error but don't throw to avoid affecting the API request
          this.logger.warn(`Failed to track activity for user ${userId}:`, error);
        });
    } catch (error) {
      // Log error but don't throw to avoid affecting the API request
      this.logger.warn(`Error in trackUserActivityAsync for user ${userId}:`, error);
    }
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
        message: 'AdminGuard::canActivate() | Unauthorized',
      });
    }

    console.log({ user });

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
