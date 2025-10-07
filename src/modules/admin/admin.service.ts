import { EEnvKey } from '@constants/env.constant';
import { CRAWL_DOCS_QUEUE_NAME } from '@constants/queue.constant';
import { AdminEntity, EAdminRole } from '@database/entities/admin.entity';
import { QuestEntity } from '@database/entities/quest.entity';
import { AdminRepository } from '@database/repositories/admin.repository';
import { CrawlDocsRepository } from '@database/repositories/crawl-docs.repository';
import { QuestRepository } from '@database/repositories/quest.repository';
import { UserQuestRepository } from '@database/repositories/user-quest.repository';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PageMetaDto } from '@shared/dtos/page-meta.dto';
import { PageOptionsDto } from '@shared/dtos/page-option.dto';
import { PageDto } from '@shared/dtos/page.dto';
import { IJwtPayloadAdmin } from '@shared/interfaces/auth.interface';
import { PasswordEncoder } from '@shared/modules/password-encoder/password-encoder';
import { Queue } from 'bull';
import { v4 as uuidv4 } from 'uuid';
import { AdminLoginDto, CrawlDocsDto, GetCrawlDocsDto } from './dtos/admin-request.dto';
import { CreateQuestDto, QuestFilterDto, QuestResponseDto, UpdateQuestDto } from './dtos/quest-management.dto';
@Injectable()
export class AdminService {
  constructor(
    @InjectQueue(CRAWL_DOCS_QUEUE_NAME) private crawlDocsQueue: Queue,
    private readonly adminRepository: AdminRepository,
    private readonly passwordEncoder: PasswordEncoder,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly crawlDocsRepository: CrawlDocsRepository,
    private readonly questRepository: QuestRepository,
    private readonly userQuestRepository: UserQuestRepository,
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
    const { urls, name, category } = crawlDocsDto;
    for (const url of urls) {
      const crawlDocs = this.crawlDocsRepository.create({
        url,
        name: name || uuidv4(),
        status: 'pending',
        isCrawlSubPath: crawlDocsDto.isCrawlSubPath,
        pathCount: 1,
        category,
      });
      await this.crawlDocsRepository.save(crawlDocs);
      await this.crawlDocsQueue.add(CRAWL_DOCS_QUEUE_NAME, crawlDocs, {
        removeOnComplete: true,
        removeOnFail: true,
      });
    }
    return {
      success: true,
    };
  }

  async getCrawlDocs(getCrawlDocsDto: GetCrawlDocsDto) {
    const { keyword, page, limit } = getCrawlDocsDto;
    const crawlDocs = this.crawlDocsRepository.createQueryBuilder('crawl_docs');

    if (keyword) {
      crawlDocs.andWhere('crawl_docs.name LIKE :keyword OR crawl_docs.url LIKE :keyword', { keyword: `%${keyword}%` });
    }

    crawlDocs.orderBy('crawl_docs.created_at', 'DESC');
    crawlDocs.skip((page - 1) * limit);
    crawlDocs.take(limit);

    const [result, total] = await crawlDocs.getManyAndCount();
    return {
      data: result,
      meta: new PageMetaDto(total, new PageOptionsDto(page, limit)),
    };
  }

  // Quest Management Methods
  async createQuest(createQuestDto: CreateQuestDto): Promise<QuestResponseDto> {
    const quest = this.questRepository.create(createQuestDto);
    const savedQuest = await this.questRepository.save(quest);
    return this.mapQuestToResponseDto(savedQuest);
  }

  async updateQuest(id: number, updateQuestDto: UpdateQuestDto): Promise<QuestResponseDto> {
    const quest = await this.questRepository.findOne({ where: { id } });
    if (!quest) {
      throw new NotFoundException(`Quest with ID ${id} not found`);
    }

    Object.assign(quest, updateQuestDto);
    const updatedQuest = await this.questRepository.save(quest);
    return this.mapQuestToResponseDto(updatedQuest);
  }

  async getQuestById(id: number): Promise<QuestResponseDto> {
    const quest = await this.questRepository.findOne({ where: { id } });
    if (!quest) {
      throw new NotFoundException(`Quest with ID ${id} not found`);
    }
    return this.mapQuestToResponseDto(quest);
  }

  async getQuests(filterDto: QuestFilterDto): Promise<PageDto<QuestResponseDto>> {
    const { page, limit, name, category, type, status } = filterDto;
    const queryBuilder = this.questRepository.createQueryBuilder('quest');

    if (name) {
      queryBuilder.andWhere('quest.name ILIKE :name', { name: `%${name}%` });
    }

    if (category !== undefined) {
      queryBuilder.andWhere('quest.category = :category', { category });
    }

    if (type !== undefined) {
      queryBuilder.andWhere('quest.type = :type', { type });
    }

    if (status !== undefined) {
      queryBuilder.andWhere('quest.status = :status', { status });
    }

    queryBuilder.orderBy('quest.createdAt', 'DESC');
    queryBuilder.skip((page - 1) * limit);
    queryBuilder.take(limit);

    const [quests, total] = await queryBuilder.getManyAndCount();

    // Get completed users count for each quest
    const questIds = quests.map(q => q.id);
    const completedCounts = await this.userQuestRepository
      .createQueryBuilder('uq')
      .select('uq.questId', 'questId')
      .addSelect('COUNT(DISTINCT uq.userId)', 'count')
      .where('uq.questId IN (:...questIds)', { questIds })
      .andWhere('uq.status = :status', { status: 'completed' })
      .groupBy('uq.questId')
      .getRawMany();

    const countMap = new Map(completedCounts.map(c => [c.questId, parseInt(c.count)]));
    const questDtos = quests.map(quest => this.mapQuestToResponseDto(quest, countMap.get(quest.id) || 0));

    return new PageDto(questDtos, new PageMetaDto(total, new PageOptionsDto(page, limit)));
  }

  async deleteQuest(id: number): Promise<void> {
    const quest = await this.questRepository.findOne({ where: { id } });
    if (!quest) {
      throw new NotFoundException(`Quest with ID ${id} not found`);
    }
    await this.questRepository.softDelete(id);
  }

  private mapQuestToResponseDto(quest: QuestEntity, completedUsersCount: number = 0): QuestResponseDto {
    return {
      id: quest.id,
      name: quest.name,
      description: quest.description,
      icon: quest.icon,
      category: quest.category,
      type: quest.type,
      requirements: quest.requirements,
      limit: quest.limit,
      points: quest.points,
      status: quest.status,
      startDate: quest.startDate,
      endDate: quest.endDate,
      completedUsersCount,
      createdAt: quest.createdAt,
      updatedAt: quest.updatedAt,
    };
  }
}
