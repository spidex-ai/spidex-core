import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateUser1744541073119 implements MigrationInterface {
    name = 'UpdateUser1744541073119'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "telegram_link"
        `);
        await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "discord_link"
        `);
        await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "x_link"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD "x_link" character varying
        `);
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD "discord_link" character varying
        `);
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD "telegram_link" character varying
        `);
    }

}
