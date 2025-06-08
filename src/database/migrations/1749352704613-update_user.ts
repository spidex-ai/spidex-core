import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateUser1749352704613 implements MigrationInterface {
    name = 'UpdateUser1749352704613'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD "stake_address" character varying
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_3024606f1d321acb58cf0674bf" ON "users" ("stake_address")
            WHERE stake_address IS NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "public"."IDX_3024606f1d321acb58cf0674bf"
        `);
        await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "stake_address"
        `);
    }

}
