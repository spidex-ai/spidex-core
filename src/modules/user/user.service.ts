import { EError } from '@constants/error.constant';
import { EUserStatus } from '@constants/user.constant';
import { UserEntity } from '@database/entities/user.entity';
import { UserRepository } from '@database/repositories/user.repository';
import {
  ConnectGoogleBodyDto,
  ConnectWalletRequestDto,
  ConnectXBodyDto
} from '@modules/auth/dtos/auth-request.dto';
import { UserReferralService } from '@modules/user-referral/user-referral.service';
import { GetLoginManagementResponseDto, UserProfileResponseDto } from '@modules/user/dtos/user-response.dto';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@shared/exception/exception.resolver';
import { plainToInstanceCustom } from '@shared/utils/class-transform';
import { getRandomUserName, isNullOrUndefined } from '@shared/utils/util';
import { Not } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import {
  UpdateProfileDto
} from './dtos/user-request.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly configService: ConfigService,
    private readonly userRepository: UserRepository,
    @Inject(forwardRef(() => UserReferralService))
    private readonly userReferralService: UserReferralService,
  ) { }

  async getUserById(id: number) {
    const user = await this.userRepository.findOne({
      where: {
        id,
      },
    });
    if (isNullOrUndefined(user)) {
      throw new BadRequestException({ validator_errors: EError.USER_NOT_EXIST, message: `UID ${id} is not found` });
    }

    return user;
  }

  async connectWallet(connectWalletInput: ConnectWalletRequestDto) {
    const { address: walletAddress } = connectWalletInput;
    const user = await this.userRepository.findOne({
      where: {
        walletAddress,
      },
    });
    if (user) {
      if (user.status != EUserStatus.ACTIVE) {
        throw new BadRequestException({
          validator_errors: EError.USER_DEACTIVATED,
        });
      }
      return user;
    }

    const newUser = await this.userRepository.create({
      walletAddress,
      status: EUserStatus.ACTIVE,
      username: getRandomUserName(),
      referralCode: this.generateReferralCode(),
    });

    await this.createUser(newUser, {
      referralCode: connectWalletInput.referralCode,
    });

    return newUser;
  }

  async connectX(connectXInput: ConnectXBodyDto) {
    const { id, username } = connectXInput;
    const user = await this.userRepository.findOne({
      where: {
        xId: id,
      },
    });

    if (user) {
      if (user.status != EUserStatus.ACTIVE) {
        throw new BadRequestException({
          validator_errors: EError.USER_DEACTIVATED,
        });
      }

      return user;
    }

    const newUser = await this.userRepository.create({
      status: EUserStatus.ACTIVE,
      username: getRandomUserName(),
      xId: id,
      xUsername: username,
      referralCode: this.generateReferralCode(),
    });

    await this.createUser(newUser, {
      referralCode: connectXInput.referralCode,
    });

    return newUser;
  }

  async connectGoogle(connectGoogleBody: ConnectGoogleBodyDto) {
    const { email, referralCode } = connectGoogleBody;
    const user = await this.userRepository.findOne({
      where: {
        email,
      },
    });

    if (user) {
      if (user.status != EUserStatus.ACTIVE) {
        throw new BadRequestException({
          validator_errors: EError.USER_DEACTIVATED,
        });
      }

      return user;
    }

    const newUser = await this.userRepository.create({
      email,
      status: EUserStatus.ACTIVE,
      username: getRandomUserName(),
      referralCode: this.generateReferralCode(),
    });

    await this.createUser(newUser, {
      referralCode,
    });

    return newUser;
  }

  @Transactional()
  async createUser(user: UserEntity, { referralCode }: { referralCode?: string }) {
    const savedUser = await this.userRepository.save(user);
    if (referralCode) {
      const referralUser = await this.userRepository.findOne({ where: { referralCode } });
      if (!referralUser) {
        throw new BadRequestException({
          validator_errors: EError.REFERRAL_CODE_NOT_FOUND,
        });
      }


      await this.userReferralService.create({
        userId: savedUser.id,
        referredBy: referralUser.id,
      });
    }
  }

  async updateProfile(userId: number, updateProfileDto: UpdateProfileDto) {
    updateProfileDto.username = updateProfileDto.username?.trim();
    updateProfileDto.fullName = updateProfileDto.fullName?.trim();
    updateProfileDto.bio = updateProfileDto.bio?.trim();
    updateProfileDto.avatar = updateProfileDto.avatar?.trim();

    if (updateProfileDto.username) {
      const usernameRegex = /^[a-zA-Z0-9]{6,20}$/;
      if (!usernameRegex.test(updateProfileDto.username)) {
        throw new BadRequestException({ validator_errors: EError.INVALID_USERNAME, message: `Username ${updateProfileDto.username} is invalid` });
      }

      const user = await this.userRepository.findOneBy({ username: updateProfileDto.username, id: Not(userId) });
      if (user) {
        throw new BadRequestException({ validator_errors: EError.USERNAME_ALREADY_EXISTS, message: `Username ${updateProfileDto.username} already exists` });
      }
    }

    // Check avatar is valid
    if (updateProfileDto.avatar) {
      const avatarRegex = /^https?:\/\/[^\s]+$/;
      if (!avatarRegex.test(updateProfileDto.avatar)) {
        throw new BadRequestException({ validator_errors: EError.INVALID_AVATAR, message: `Avatar ${updateProfileDto.avatar} is invalid` });
      }
    }

    await this.userRepository.update({ id: userId }, updateProfileDto);
    return this.userRepository.findOneBy({ id: userId });
  }

  async getMyProfile(userId: number): Promise<UserProfileResponseDto> {
    const user = await this.userRepository.findOneBy({ id: userId });
    const result = plainToInstanceCustom(UserProfileResponseDto, user);
    return result;
  }

  async getLoginManagement(userId: number): Promise<GetLoginManagementResponseDto> {
    const user = await this.userRepository.findOneBy({ id: userId });
    return plainToInstanceCustom(GetLoginManagementResponseDto, user);
  }

  async getProfile(walletAddress: string) {
    const user = await this.userRepository.findOneBy({ walletAddress });
    if (!user) {
      throw new BadRequestException({
        validator_errors: EError.USER_NOT_EXIST,
        message: `User is not found`,
      });
    }
    return { user };
  }

  async getOrCreateReferralCode(userId: number): Promise<string> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user.referralCode) {
      user.referralCode = this.generateReferralCode();
      await this.userRepository.save(user);
    }
    return user.referralCode;
  }

  private generateReferralCode(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}
