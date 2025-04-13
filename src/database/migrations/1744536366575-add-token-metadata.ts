import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTokenMetadata1744536366575 implements MigrationInterface {
    name = 'AddTokenMetadata1744536366575'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_e8cd85bd1bf02c9c6821fc1d79" ON "token_metadata" ("unit")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "public"."IDX_e8cd85bd1bf02c9c6821fc1d79"
        `);
    }

}
