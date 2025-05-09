import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { AdminEntity, EAdminRole } from '@database/entities/admin.entity';
import { Repository } from 'typeorm';
import { AdminRepository } from '@database/repositories/admin.repository';
import { PasswordEncoder } from '@shared/modules/password-encoder/password-encoder';
import { AdminLoginDto, CrawlDocsDto } from './dtos/admin-request.dto';
import { IJwtPayloadAdmin } from '@shared/interfaces/auth.interface';
import { JwtService } from '@nestjs/jwt';
import { EEnvKey } from '@constants/env.constant';
import { ConfigService } from '@nestjs/config';
import { CrawlDocsRepository } from '@database/repositories/crawl-docs.repository';
import { v4 as uuidv4 } from 'uuid';
import { InjectQueue } from '@nestjs/bullmq';
import { CRAWL_DOCS_QUEUE_NAME } from '@constants/queue.constant';
import { Queue } from 'bull';
@Injectable()
export class AdminService {
  constructor(
    @InjectQueue(CRAWL_DOCS_QUEUE_NAME) private crawlDocsQueue: Queue,
    private readonly adminRepository: AdminRepository,
    private readonly passwordEncoder: PasswordEncoder,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly crawlDocsRepository: CrawlDocsRepository,
  ) {}

  async create() {
    const password = await this.passwordEncoder.hashPassword('spidex@tothemoon');
    const admin = this.adminRepository.create({
      username: 'admin',
      password: password,
      name: 'admin',
      role: EAdminRole.SUPER_ADMIN,
      isActive: true,
    });
    return this.adminRepository.save(admin);
  }

  async login(loginDto: AdminLoginDto) {
    const admin = await this.adminRepository.findOne({
      where: { username: loginDto.username },
    });
    if (!admin) {
      throw new UnauthorizedException('Invalid username or password');
    }
    const isPasswordValid = await this.passwordEncoder.comparePassword(loginDto.password, admin.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid username or password');
    }
    const tokens = await this.generateToken(admin);
    return {
      ...tokens,
    };
  }

  async generateToken(admin: AdminEntity) {
    const payload: IJwtPayloadAdmin = {
      adminId: admin.id,
      username: admin.username,
    };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get(EEnvKey.JWT_ACCESS_TOKEN_SECRET),
      expiresIn: 1209600000,
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get(EEnvKey.JWT_REFRESH_TOKEN_SECRET),
      expiresIn: 1209600000,
    });
    return { accessToken, refreshToken }; 
  }

  async crawlDocs(crawlDocsDto: CrawlDocsDto) { 
    const { urls, name } = crawlDocsDto;
    for (const url of urls) {
      const crawlDocs = this.crawlDocsRepository.create({
        url,
        name: name || uuidv4(),
        status: 'pending',
      });
      await this.crawlDocsRepository.save(crawlDocs);
      await this.crawlDocsQueue.add(CRAWL_DOCS_QUEUE_NAME, crawlDocs);
    }
    return {
      success: true,
    };
  }
}
