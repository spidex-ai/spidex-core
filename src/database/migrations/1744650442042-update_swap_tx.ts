import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateSwapTx1744650442042 implements MigrationInterface {
  name = 'UpdateSwapTx1744650442042';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "swap_transactions"
            ALTER COLUMN "lp_token_unit" DROP NOT NULL
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "swap_transactions"
            ALTER COLUMN "lp_token_unit"
            SET NOT NULL
        `);
  }
}
