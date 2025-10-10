import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSortToQuest1760079364701 implements MigrationInterface {
  name = 'AddSortToQuest1760079364701';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "quests"
            ADD "order" integer NOT NULL DEFAULT '0'
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "quests" DROP COLUMN "order"
        `);
  }
}
