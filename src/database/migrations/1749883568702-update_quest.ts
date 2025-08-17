import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateQuest1749883568702 implements MigrationInterface {
    name = 'UpdateQuest1749883568702'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user_quests"
            ADD "started_at" TIMESTAMP
        `);
        await queryRunner.query(`
            ALTER TABLE "user_quests"
            ADD "verifying_at" TIMESTAMP
        `);
        await queryRunner.query(`
            ALTER TABLE "user_quests"
            ADD "completed_at" TIMESTAMP
        `);
        await queryRunner.query(`
            DROP INDEX "public"."user_quest_user_id_quyest_id_status_idx"
        `);
        await queryRunner.query(`
            ALTER TYPE "public"."user_quests_status_enum"
            RENAME TO "user_quests_status_enum_old"
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."user_quests_status_enum" AS ENUM('0', '1', '2', '3')
        `);
        await queryRunner.query(`
            ALTER TABLE "user_quests"
            ALTER COLUMN "status" DROP DEFAULT
        `);
        await queryRunner.query(`
            ALTER TABLE "user_quests"
            ALTER COLUMN "status" TYPE "public"."user_quests_status_enum" USING "status"::"text"::"public"."user_quests_status_enum"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_quests"
            ALTER COLUMN "status"
            SET DEFAULT '3'
        `);
        await queryRunner.query(`
            DROP TYPE "public"."user_quests_status_enum_old"
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
            CREATE TYPE "public"."user_quests_status_enum_old" AS ENUM('0', '1', '2')
        `);
        await queryRunner.query(`
            ALTER TABLE "user_quests"
            ALTER COLUMN "status" DROP DEFAULT
        `);
        await queryRunner.query(`
            ALTER TABLE "user_quests"
            ALTER COLUMN "status" TYPE "public"."user_quests_status_enum_old" USING "status"::"text"::"public"."user_quests_status_enum_old"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_quests"
            ALTER COLUMN "status"
            SET DEFAULT '2'
        `);
        await queryRunner.query(`
            DROP TYPE "public"."user_quests_status_enum"
        `);
        await queryRunner.query(`
            ALTER TYPE "public"."user_quests_status_enum_old"
            RENAME TO "user_quests_status_enum"
        `);
        await queryRunner.query(`
            CREATE INDEX "user_quest_user_id_quyest_id_status_idx" ON "user_quests" ("user_id", "quest_id", "status")
        `);
        await queryRunner.query(`
            ALTER TABLE "user_quests" DROP COLUMN "completed_at"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_quests" DROP COLUMN "verifying_at"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_quests" DROP COLUMN "started_at"
        `);
    }

}
