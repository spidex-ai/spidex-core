import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateEvent1757268743048 implements MigrationInterface {
  name = 'UpdateEvent1757268743048';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "public"."zealy_user_quests_status_enum" AS ENUM('0', '1')
        `);
    await queryRunner.query(`
            CREATE TABLE "zealy_user_quests" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                "user_id" integer NOT NULL,
                "zealy_quest_id" integer NOT NULL,
                "zealy_user_id" character varying NOT NULL,
                "zealy_request_id" character varying NOT NULL,
                "status" "public"."zealy_user_quests_status_enum" NOT NULL DEFAULT '0',
                "verified_at" TIMESTAMP,
                CONSTRAINT "PK_6408f5c86eb78940888c96ef33d" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "zealy_user_quest_zealy_user_id_idx" ON "zealy_user_quests" ("zealy_user_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "zealy_user_quest_user_id_quest_id_idx" ON "zealy_user_quests" ("user_id", "zealy_quest_id")
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."zealy_quests_category_enum" AS ENUM('0', '1', '2')
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."zealy_quests_type_enum" AS ENUM('0', '1')
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."zealy_quests_status_enum" AS ENUM('1', '0')
        `);
    await queryRunner.query(`
            CREATE TABLE "zealy_quests" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                "zealy_quest_id" character varying NOT NULL,
                "name" character varying NOT NULL,
                "category" "public"."zealy_quests_category_enum" NOT NULL,
                "type" "public"."zealy_quests_type_enum" NOT NULL,
                "requirements" jsonb,
                "status" "public"."zealy_quests_status_enum" NOT NULL DEFAULT '1',
                "has_duration" boolean NOT NULL DEFAULT false,
                "start_date" TIMESTAMP,
                "end_date" TIMESTAMP,
                CONSTRAINT "UQ_6dc95142af57e9f35338151bdc6" UNIQUE ("zealy_quest_id"),
                CONSTRAINT "PK_d2ae0269abc2296148c37f1f4c2" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "zealy_user_quests"
            ADD CONSTRAINT "FK_8ab9393f092385e5e3af4ab057d" FOREIGN KEY ("zealy_quest_id") REFERENCES "zealy_quests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "zealy_user_quests" DROP CONSTRAINT "FK_8ab9393f092385e5e3af4ab057d"
        `);
    await queryRunner.query(`
            DROP TABLE "zealy_quests"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."zealy_quests_status_enum"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."zealy_quests_type_enum"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."zealy_quests_category_enum"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."zealy_user_quest_user_id_quest_id_idx"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."zealy_user_quest_zealy_user_id_idx"
        `);
    await queryRunner.query(`
            DROP TABLE "zealy_user_quests"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."zealy_user_quests_status_enum"
        `);
  }
}
