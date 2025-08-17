import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateEventTable1753713528752 implements MigrationInterface {
    name = 'UpdateEventTable1753713528752'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "events" DROP COLUMN "trade_tokens"
        `);
        await queryRunner.query(`
            ALTER TABLE "events" DROP COLUMN "prize_config"
        `);
        await queryRunner.query(`
            ALTER TABLE "events"
            ADD "trade_token" character varying NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "events"
            ADD "url" text
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "events" DROP COLUMN "url"
        `);
        await queryRunner.query(`
            ALTER TABLE "events" DROP COLUMN "trade_token"
        `);
        await queryRunner.query(`
            ALTER TABLE "events"
            ADD "prize_config" jsonb
        `);
        await queryRunner.query(`
            ALTER TABLE "events"
            ADD "trade_tokens" jsonb NOT NULL
        `);
    }

}
