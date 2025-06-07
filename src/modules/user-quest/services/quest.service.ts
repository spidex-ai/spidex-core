import { EQuestCategory, EQuestStatus, EQuestType, QuestEntity } from '@database/entities/quest.entity';
import { QuestRepository } from '@database/repositories/quest.repository';
import { Injectable } from '@nestjs/common';
import { In, IsNull, LessThan, MoreThan } from 'typeorm';

@Injectable()
export class QuestService {
  constructor(private questRepository: QuestRepository) {}

  async getQuests(): Promise<QuestEntity[]> {
    const currentDate = new Date();
    return this.questRepository.find({
      where: [
        {
          status: EQuestStatus.ACTIVE,
          startDate: LessThan(currentDate),
          endDate: MoreThan(currentDate),
        },
        {
          status: EQuestStatus.ACTIVE,
          startDate: LessThan(currentDate),
          endDate: IsNull(),
        },
        {
          status: EQuestStatus.ACTIVE,
          startDate: IsNull(),
          endDate: MoreThan(currentDate),
        },
        {
          status: EQuestStatus.ACTIVE,
          startDate: IsNull(),
          endDate: IsNull(),
        },
      ],
    });
  }

  async getQuestById(questId: number): Promise<QuestEntity | null> {
    return this.questRepository.findOne({ where: { id: questId } });
  }

  async getQuestByType(questType: EQuestType): Promise<QuestEntity | null> {
    const currentDate = new Date();
    return this.questRepository.findOne({
      where: [
        {
          type: questType,
          status: EQuestStatus.ACTIVE,
          startDate: LessThan(currentDate),
          endDate: MoreThan(currentDate),
        },
        {
          type: questType,
          status: EQuestStatus.ACTIVE,
          startDate: LessThan(currentDate),
          endDate: IsNull(),
        },
        {
          type: questType,
          status: EQuestStatus.ACTIVE,
          startDate: IsNull(),
          endDate: MoreThan(currentDate),
        },
        {
          type: questType,
          status: EQuestStatus.ACTIVE,
          startDate: IsNull(),
          endDate: IsNull(),
        },
      ],
    });
  }

  async getQuestInType(questTypes: EQuestType[]): Promise<QuestEntity[]> {
    const currentDate = new Date();
    return this.questRepository.find({
      where: [
        {
          type: In(questTypes),
          status: EQuestStatus.ACTIVE,
          startDate: LessThan(currentDate),
          endDate: MoreThan(currentDate),
        },
        {
          type: In(questTypes),
          status: EQuestStatus.ACTIVE,
          startDate: LessThan(currentDate),
          endDate: IsNull(),
        },
        {
          type: In(questTypes),
          status: EQuestStatus.ACTIVE,
          startDate: IsNull(),
          endDate: MoreThan(currentDate),
        },
        {
          type: In(questTypes),
          status: EQuestStatus.ACTIVE,
          startDate: IsNull(),
          endDate: IsNull(),
        },
      ],
    });
  }

  async getQuestByCategory(category: EQuestCategory): Promise<QuestEntity[]> {
    const currentDate = new Date();
    const quests = await this.questRepository.find({
      where: [
        {
          category: category,
          status: EQuestStatus.ACTIVE,
          startDate: LessThan(currentDate),
          endDate: MoreThan(currentDate),
        },
        {
          category: category,
          status: EQuestStatus.ACTIVE,
          startDate: LessThan(currentDate),
          endDate: IsNull(),
        },
        {
          category: category,
          status: EQuestStatus.ACTIVE,
          startDate: IsNull(),
          endDate: MoreThan(currentDate),
        },
        {
          category: category,
          status: EQuestStatus.ACTIVE,
          startDate: IsNull(),
          endDate: IsNull(),
        },
      ],
      order: {
        updatedAt: 'DESC',
        id: 'DESC',
      },
    });

    return quests;
  }
}
