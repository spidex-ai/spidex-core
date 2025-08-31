import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEventInfo1756647174570 implements MigrationInterface {
    name = 'AddEventInfo1756647174570'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "events"
            ADD "estimate_distribution_date" TIMESTAMP
        `);
        await queryRunner.query(`
            ALTER TABLE "events"
            ADD "distribution_date" TIMESTAMP
        `);
        await queryRunner.query(`
            ALTER TABLE "events"
            ADD "banner" character varying
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "events" DROP COLUMN "banner"
        `);
        await queryRunner.query(`
            ALTER TABLE "events" DROP COLUMN "distribution_date"
        `);
        await queryRunner.query(`
            ALTER TABLE "events" DROP COLUMN "estimate_distribution_date"
        `);
    }

}
