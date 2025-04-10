import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1744299622273 implements MigrationInterface {
    name = 'Init1744299622273'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "wallet_address" character varying,
                "username" character varying,
                "full_name" character varying,
                "x_id" character varying,
                "x_username" character varying,
                "email" character varying,
                "bio" character varying,
                "avatar" character varying,
                "status" character varying NOT NULL DEFAULT 'ACTIVE',
                "referral_code" character varying,
                "telegram_link" character varying,
                "discord_link" character varying,
                "x_link" character varying,
                CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_7038d44154f0e1c8213352b403" ON "users" ("wallet_address")
            WHERE wallet_address IS NOT NULL
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_a8df922c433e68ca3b628e7b73" ON "users" ("username")
            WHERE username IS NOT NULL
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_1937e01f7978ea612533b97ca0" ON "users" ("x_id")
            WHERE x_id IS NOT NULL
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_65cbf5fcb331619593ee334c7c" ON "users" ("email")
            WHERE email IS NOT NULL
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."quests_category_enum" AS ENUM('0', '1', '2')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."quests_type_enum" AS ENUM(
                '0',
                '1',
                '2',
                '3',
                '4',
                '5',
                '6',
                '10',
                '20',
                '21'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."quests_status_enum" AS ENUM('1', '0')
        `);
        await queryRunner.query(`
            CREATE TABLE "quests" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                "name" character varying NOT NULL,
                "description" character varying,
                "category" "public"."quests_category_enum" NOT NULL,
                "type" "public"."quests_type_enum" NOT NULL,
                "requirements" jsonb,
                "limit" integer NOT NULL DEFAULT '1',
                "points" numeric NOT NULL,
                "status" "public"."quests_status_enum" NOT NULL,
                "start_date" TIMESTAMP,
                "end_date" TIMESTAMP,
                CONSTRAINT "PK_a037497017b64f530fe09c75364" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "user_quests" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                "user_id" integer NOT NULL,
                "quest_id" integer NOT NULL,
                "points" numeric NOT NULL,
                CONSTRAINT "PK_26397091cd37dde7d59fde6084d" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "user_quest_user_id_quest_id_created_at_deleted_at_idx" ON "user_quests" (
                "user_id",
                "quest_id",
                "created_at",
                "deleted_at"
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "user_quest_created_at_idx" ON "user_quests" ("created_at")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."user_point_logs_point_type_enum" AS ENUM('core', 'quest', 'referral')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."user_point_logs_log_type_enum" AS ENUM(
                'from_quest',
                'from_referral',
                'from_system',
                'from_core'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "user_point_logs" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                "user_id" integer NOT NULL,
                "amount" numeric(36, 8) NOT NULL DEFAULT '0',
                "point_type" "public"."user_point_logs_point_type_enum" NOT NULL,
                "log_type" "public"."user_point_logs_log_type_enum" NOT NULL,
                "user_quest_id" integer,
                "referral_id" integer,
                CONSTRAINT "REL_5f7a1fcfcb2b8d42a41db8898e" UNIQUE ("user_quest_id"),
                CONSTRAINT "PK_43d59f187036a51d98b07c47020" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_user_point_created_amount" ON "user_point_logs" ("created_at", "user_id", "amount")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_user_point_log_created_at" ON "user_point_logs" ("created_at")
        `);
        await queryRunner.query(`
            CREATE TABLE "user_referrals" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                "user_id" integer NOT NULL,
                "referred_by" integer NOT NULL,
                "points" numeric NOT NULL DEFAULT '0',
                CONSTRAINT "UQ_4d434f568da1079713c316154aa" UNIQUE ("user_id"),
                CONSTRAINT "PK_6aa5154ef7ddb379082279aa87b" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."achievements_status_enum" AS ENUM('1', '0')
        `);
        await queryRunner.query(`
            CREATE TABLE "achievements" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                "name" character varying NOT NULL,
                "icon" character varying NOT NULL,
                "points" numeric NOT NULL,
                "status" "public"."achievements_status_enum" NOT NULL,
                "description" character varying,
                CONSTRAINT "PK_1bc19c37c6249f70186f318d71d" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "user_achievements" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                "user_id" integer NOT NULL,
                "achievement_id" integer NOT NULL,
                "unlocked_at" TIMESTAMP NOT NULL,
                CONSTRAINT "PK_3d94aba7e9ed55365f68b5e77fa" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "user_points" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                "user_id" integer NOT NULL,
                "amount" numeric(36, 8) NOT NULL DEFAULT '0',
                CONSTRAINT "UQ_b63a87a96091c755b78a75eecbc" UNIQUE ("user_id"),
                CONSTRAINT "PK_b91f00258263b9d728c7b320674" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "user_quests"
            ADD CONSTRAINT "FK_9300d9ae06520676d0f616e1cd2" FOREIGN KEY ("quest_id") REFERENCES "quests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "user_point_logs"
            ADD CONSTRAINT "FK_b676734492e9177158b16a73d79" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "user_point_logs"
            ADD CONSTRAINT "FK_5f7a1fcfcb2b8d42a41db8898ee" FOREIGN KEY ("user_quest_id") REFERENCES "user_quests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "user_point_logs"
            ADD CONSTRAINT "FK_1eaf0e946c26a989a73e72a083a" FOREIGN KEY ("referral_id") REFERENCES "user_referrals"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "user_referrals"
            ADD CONSTRAINT "FK_b06f9d12f97b5442e00fe25dd8d" FOREIGN KEY ("referred_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "user_referrals"
            ADD CONSTRAINT "FK_4d434f568da1079713c316154aa" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "user_achievements"
            ADD CONSTRAINT "FK_c755e3741cd46fc5ae3ef06592c" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "user_achievements"
            ADD CONSTRAINT "FK_36b4a912357ad1342b735d4d4c8" FOREIGN KEY ("achievement_id") REFERENCES "achievements"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "user_points"
            ADD CONSTRAINT "FK_b63a87a96091c755b78a75eecbc" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            CREATE TABLE "query-result-cache" (
                "id" SERIAL NOT NULL,
                "identifier" character varying,
                "time" bigint NOT NULL,
                "duration" integer NOT NULL,
                "query" text NOT NULL,
                "result" text NOT NULL,
                CONSTRAINT "PK_6a98f758d8bfd010e7e10ffd3d3" PRIMARY KEY ("id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE "query-result-cache"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_points" DROP CONSTRAINT "FK_b63a87a96091c755b78a75eecbc"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_achievements" DROP CONSTRAINT "FK_36b4a912357ad1342b735d4d4c8"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_achievements" DROP CONSTRAINT "FK_c755e3741cd46fc5ae3ef06592c"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_referrals" DROP CONSTRAINT "FK_4d434f568da1079713c316154aa"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_referrals" DROP CONSTRAINT "FK_b06f9d12f97b5442e00fe25dd8d"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_point_logs" DROP CONSTRAINT "FK_1eaf0e946c26a989a73e72a083a"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_point_logs" DROP CONSTRAINT "FK_5f7a1fcfcb2b8d42a41db8898ee"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_point_logs" DROP CONSTRAINT "FK_b676734492e9177158b16a73d79"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_quests" DROP CONSTRAINT "FK_9300d9ae06520676d0f616e1cd2"
        `);
        await queryRunner.query(`
            DROP TABLE "user_points"
        `);
        await queryRunner.query(`
            DROP TABLE "user_achievements"
        `);
        await queryRunner.query(`
            DROP TABLE "achievements"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."achievements_status_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "user_referrals"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_user_point_log_created_at"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_user_point_created_amount"
        `);
        await queryRunner.query(`
            DROP TABLE "user_point_logs"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."user_point_logs_log_type_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."user_point_logs_point_type_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."user_quest_created_at_idx"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."user_quest_user_id_quest_id_created_at_deleted_at_idx"
        `);
        await queryRunner.query(`
            DROP TABLE "user_quests"
        `);
        await queryRunner.query(`
            DROP TABLE "quests"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."quests_status_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."quests_type_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."quests_category_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_65cbf5fcb331619593ee334c7c"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_1937e01f7978ea612533b97ca0"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_a8df922c433e68ca3b628e7b73"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_7038d44154f0e1c8213352b403"
        `);
        await queryRunner.query(`
            DROP TABLE "users"
        `);
    }

}
