import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateZealyQuest1757312545459 implements MigrationInterface {
    name = 'UpdateZealyQuest1757312545459'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "zealy_quests"
            ADD "zealy_community_id" character varying NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "zealy_quests" DROP COLUMN "zealy_community_id"
        `);
    }

}
