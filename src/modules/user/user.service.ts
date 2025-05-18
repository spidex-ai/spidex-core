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

  async getUserById(id: number, throwError = true) {
    const user = await this.userRepository.findOne({
      where: {
        id,
      },
    });
    if (isNullOrUndefined(user)) {
      if (throwError) {
        throw new BadRequestException({ validatorErrors: EError.USER_NOT_EXIST, message: `UID ${id} is not found` });
      }
      return null;
    }

    return user;
  }

  async connectWallet(connectWalletInput: ConnectWalletRequestDto, userId?: number) {
    if (userId) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new BadRequestException({
          validatorErrors: EError.USER_NOT_EXIST,
          message: `User is not found`,
        });
      }

      if (user.walletAddress) {
        throw new BadRequestException({
          validatorErrors: EError.ALREADY_CONNECTED_WALLET,
          message: `User is already connected to wallet`,
        });
      }

      const existingUser = await this.userRepository.findOne({ where: { walletAddress: connectWalletInput.address } });
      if (existingUser) {
        throw new BadRequestException({
          validatorErrors: EError.WALLET_ADDRESS_USED,
          message: `Wallet address is already used`,
        });
      }

      user.walletAddress = connectWalletInput.address;
      await this.userRepository.save(user);
      return user;
    } else {
      const { address: walletAddress } = connectWalletInput;
      const user = await this.userRepository.findOne({
        where: {
          walletAddress,
        },
      });
      if (user) {
        if (user.status != EUserStatus.ACTIVE) {
          throw new BadRequestException({
            validatorErrors: EError.USER_DEACTIVATED,
            message: `User is deactivated`,
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
  }

  async connectX(connectXInput: ConnectXBodyDto, userId?: number) {
    const { id, username } = connectXInput;
    if (userId) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new BadRequestException({
          validatorErrors: EError.USER_NOT_EXIST,
          message: `User is not found`,
        });
      }

      if (user.xId) {
        throw new BadRequestException({
          validatorErrors: EError.ALREADY_CONNECTED_X,
          message: `User is already connected to X`,
        });
      }

      const existingUser = await this.userRepository.findOne({ where: { xId: id } });
      if (existingUser) {
        throw new BadRequestException({
          validatorErrors: EError.X_USERNAME_USED,
          message: `X username is already used`,
        });
      }

      user.xId = id;
      user.xUsername = username;
      await this.userRepository.save(user);
      return user;

    } else {
      const user = await this.userRepository.findOne({
        where: {
          xId: id,
        },
      });

      if (user) {
        if (user.status != EUserStatus.ACTIVE) {
          throw new BadRequestException({
            validatorErrors: EError.USER_DEACTIVATED,
            message: `User is deactivated`,
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
  }

  async connectGoogle(connectGoogleBody: ConnectGoogleBodyDto, userId?: number) {
    const { email, referralCode } = connectGoogleBody;
    if (userId) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new BadRequestException({
          validatorErrors: EError.USER_NOT_EXIST,
          message: `User is not found`,
        });
      }
      if (user.email) {
        throw new BadRequestException({
          validatorErrors: EError.GOOGLE_EMAIL_USED,
          message: `Email is already used`,
        });
      }

      const existingUser = await this.userRepository.findOne({ where: { email } });
      if (existingUser) {
        throw new BadRequestException({
          validatorErrors: EError.GOOGLE_EMAIL_USED,
          message: `Email is already used`,
        });
      }

      user.email = email;
      await this.userRepository.save(user);
      return user;
    } else {
      const user = await this.userRepository.findOne({
        where: {
          email,
        },
      });

      if (user) {
        if (user.status != EUserStatus.ACTIVE) {
          throw new BadRequestException({
            validatorErrors: EError.USER_DEACTIVATED,
            message: `User is deactivated`,
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
  }

  @Transactional()
  async createUser(user: UserEntity, { referralCode }: { referralCode?: string }) {
    const savedUser = await this.userRepository.save(user);
    if (referralCode) {
      const referralUser = await this.userRepository.findOne({ where: { referralCode } });
      if (!referralUser) {
        throw new BadRequestException({
          validatorErrors: EError.REFERRAL_CODE_NOT_FOUND,
          message: `Referral code is not found`,
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
        throw new BadRequestException({ validatorErrors: EError.INVALID_USERNAME, message: `Username ${updateProfileDto.username} is invalid` });
      }

      const user = await this.userRepository.findOneBy({ username: updateProfileDto.username, id: Not(userId) });
      if (user) {
        throw new BadRequestException({ validatorErrors: EError.USERNAME_ALREADY_EXISTS, message: `Username ${updateProfileDto.username} already exists` });
      }
    }

    // Check avatar is valid
    if (updateProfileDto.avatar) {
      const avatarRegex = /^https?:\/\/[^\s]+$/;
      if (!avatarRegex.test(updateProfileDto.avatar)) {
        throw new BadRequestException({ validatorErrors: EError.INVALID_AVATAR, message: `Avatar ${updateProfileDto.avatar} is invalid` });
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
        validatorErrors: EError.USER_NOT_EXIST,
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
