import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateSwapTx1744656547651 implements MigrationInterface {
    name = 'UpdateSwapTx1744656547651'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "swap_transactions"
            ADD "total_usd" numeric(36, 18) NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "swap_transactions" DROP COLUMN "total_usd"
        `);
    }

}
