import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateQuest1749051034978 implements MigrationInterface {
  name = 'UpdateQuest1749051034978';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "public"."user_quests_status_enum" AS ENUM('0', '1', '2')
        `);
    await queryRunner.query(`
            ALTER TABLE "user_quests"
            ADD "status" "public"."user_quests_status_enum" NOT NULL DEFAULT '2'
        `);
    await queryRunner.query(`
            CREATE INDEX "user_quest_user_id_quyest_id_status_idx" ON "user_quests" ("user_id", "quest_id", "status")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "public"."user_quest_user_id_quyest_id_status_idx"
        `);
    await queryRunner.query(`
            ALTER TABLE "user_quests" DROP COLUMN "status"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."user_quests_status_enum"
        `);
  }
}
