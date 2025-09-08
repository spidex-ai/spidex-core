import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateTokenMeta1757344120409 implements MigrationInterface {
    name = 'UpdateTokenMeta1757344120409'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "token_metadata"
            ADD "name_hex" character varying
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "token_metadata" DROP COLUMN "name_hex"
        `);
    }

}
