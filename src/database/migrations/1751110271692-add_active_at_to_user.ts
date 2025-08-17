import { MigrationInterface, QueryRunner } from "typeorm";

export class AddActiveAtToUser1751110271692 implements MigrationInterface {
    name = 'AddActiveAtToUser1751110271692'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD "last_activity_at" TIMESTAMP
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "last_activity_at"
        `);
    }

}
