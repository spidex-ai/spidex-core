import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateSwapTx1744650987197 implements MigrationInterface {
    name = 'UpdateSwapTx1744650987197'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "swap_transactions"
            ADD "total_fee" numeric(36, 18) NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "swap_transactions" DROP COLUMN "total_fee"
        `);
    }

}
