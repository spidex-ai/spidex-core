import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateSchemn1746794043998 implements MigrationInterface {
    name = 'UpdateSchemn1746794043998'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "crawl_docs"
            ALTER COLUMN "created_at"
            SET NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "crawl_docs"
            ALTER COLUMN "created_at"
            SET DEFAULT now()
        `);
        await queryRunner.query(`
            ALTER TABLE "crawl_docs"
            ALTER COLUMN "updated_at"
            SET NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "crawl_docs"
            ALTER COLUMN "updated_at"
            SET DEFAULT now()
        `);
        await queryRunner.query(`
            ALTER TABLE "crawl_docs" DROP COLUMN "name"
        `);
        await queryRunner.query(`
            ALTER TABLE "crawl_docs"
            ADD "name" character varying
        `);
        await queryRunner.query(`
            ALTER TABLE "crawl_docs" DROP COLUMN "category"
        `);
        await queryRunner.query(`
            ALTER TABLE "crawl_docs"
            ADD "category" character varying
        `);
        await queryRunner.query(`
            ALTER TABLE "crawl_docs" DROP COLUMN "url"
        `);
        await queryRunner.query(`
            ALTER TABLE "crawl_docs"
            ADD "url" character varying NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "crawl_docs" DROP COLUMN "status"
        `);
        await queryRunner.query(`
            ALTER TABLE "crawl_docs"
            ADD "status" character varying NOT NULL DEFAULT 'pending'
        `);
        await queryRunner.query(`
            ALTER TABLE "admins"
            ALTER COLUMN "created_at"
            SET NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "admins"
            ALTER COLUMN "created_at"
            SET DEFAULT now()
        `);
        await queryRunner.query(`
            ALTER TABLE "admins"
            ALTER COLUMN "updated_at"
            SET NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "admins"
            ALTER COLUMN "updated_at"
            SET DEFAULT now()
        `);
        await queryRunner.query(`
            ALTER TABLE "admins" DROP CONSTRAINT "admins_username_key"
        `);
        await queryRunner.query(`
            ALTER TABLE "admins" DROP COLUMN "username"
        `);
        await queryRunner.query(`
            ALTER TABLE "admins"
            ADD "username" character varying NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "admins"
            ADD CONSTRAINT "UQ_4ba6d0c734d53f8e1b2e24b6c56" UNIQUE ("username")
        `);
        await queryRunner.query(`
            ALTER TABLE "admins" DROP COLUMN "password"
        `);
        await queryRunner.query(`
            ALTER TABLE "admins"
            ADD "password" character varying NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "admins" DROP COLUMN "name"
        `);
        await queryRunner.query(`
            ALTER TABLE "admins"
            ADD "name" character varying
        `);
        await queryRunner.query(`
            ALTER TABLE "admins" DROP COLUMN "role"
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."admins_role_enum" AS ENUM('SUPER_ADMIN', 'ADMIN', 'MODERATOR')
        `);
        await queryRunner.query(`
            ALTER TABLE "admins"
            ADD "role" "public"."admins_role_enum" NOT NULL DEFAULT 'SUPER_ADMIN'
        `);
        await queryRunner.query(`
            ALTER TABLE "admins"
            ALTER COLUMN "is_active"
            SET NOT NULL
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_e5bc1b6c869a4d009e25414341" ON "swap_transactions" ("tx_hash", "status")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "public"."IDX_e5bc1b6c869a4d009e25414341"
        `);
        await queryRunner.query(`
            ALTER TABLE "admins"
            ALTER COLUMN "is_active" DROP NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "admins" DROP COLUMN "role"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."admins_role_enum"
        `);
        await queryRunner.query(`
            ALTER TABLE "admins"
            ADD "role" character varying(50) NOT NULL DEFAULT 'SUPER_ADMIN'
        `);
        await queryRunner.query(`
            ALTER TABLE "admins" DROP COLUMN "name"
        `);
        await queryRunner.query(`
            ALTER TABLE "admins"
            ADD "name" character varying(255) NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "admins" DROP COLUMN "password"
        `);
        await queryRunner.query(`
            ALTER TABLE "admins"
            ADD "password" character varying(255) NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "admins" DROP CONSTRAINT "UQ_4ba6d0c734d53f8e1b2e24b6c56"
        `);
        await queryRunner.query(`
            ALTER TABLE "admins" DROP COLUMN "username"
        `);
        await queryRunner.query(`
            ALTER TABLE "admins"
            ADD "username" character varying(255) NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "admins"
            ADD CONSTRAINT "admins_username_key" UNIQUE ("username")
        `);
        await queryRunner.query(`
            ALTER TABLE "admins"
            ALTER COLUMN "updated_at"
            SET DEFAULT CURRENT_TIMESTAMP
        `);
        await queryRunner.query(`
            ALTER TABLE "admins"
            ALTER COLUMN "updated_at" DROP NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "admins"
            ALTER COLUMN "created_at"
            SET DEFAULT CURRENT_TIMESTAMP
        `);
        await queryRunner.query(`
            ALTER TABLE "admins"
            ALTER COLUMN "created_at" DROP NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "crawl_docs" DROP COLUMN "status"
        `);
        await queryRunner.query(`
            ALTER TABLE "crawl_docs"
            ADD "status" character varying(255) NOT NULL DEFAULT 'pending'
        `);
        await queryRunner.query(`
            ALTER TABLE "crawl_docs" DROP COLUMN "url"
        `);
        await queryRunner.query(`
            ALTER TABLE "crawl_docs"
            ADD "url" character varying(255) NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "crawl_docs" DROP COLUMN "category"
        `);
        await queryRunner.query(`
            ALTER TABLE "crawl_docs"
            ADD "category" character varying(255)
        `);
        await queryRunner.query(`
            ALTER TABLE "crawl_docs" DROP COLUMN "name"
        `);
        await queryRunner.query(`
            ALTER TABLE "crawl_docs"
            ADD "name" character varying(255)
        `);
        await queryRunner.query(`
            ALTER TABLE "crawl_docs"
            ALTER COLUMN "updated_at"
            SET DEFAULT CURRENT_TIMESTAMP
        `);
        await queryRunner.query(`
            ALTER TABLE "crawl_docs"
            ALTER COLUMN "updated_at" DROP NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "crawl_docs"
            ALTER COLUMN "created_at"
            SET DEFAULT CURRENT_TIMESTAMP
        `);
        await queryRunner.query(`
            ALTER TABLE "crawl_docs"
            ALTER COLUMN "created_at" DROP NOT NULL
        `);
    }

}
