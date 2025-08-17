import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIconToQuest1750501338025 implements MigrationInterface {
    name = 'AddIconToQuest1750501338025'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "quests"
            ADD "icon" text
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "quests" DROP COLUMN "icon"
        `);
    }

}
