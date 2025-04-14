import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateSwapTx1744650513118 implements MigrationInterface {
    name = 'UpdateSwapTx1744650513118'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "swap_transactions"
            ALTER COLUMN "price" DROP NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "swap_transactions"
            ALTER COLUMN "price"
            SET NOT NULL
        `);
    }

}
