import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateSwapTx1744650103903 implements MigrationInterface {
  name = 'UpdateSwapTx1744650103903';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "public"."swap_transactions_status_enum" AS ENUM('building', 'submitted', 'success', 'failed')
        `);
    await queryRunner.query(`
            ALTER TABLE "swap_transactions"
            ADD "status" "public"."swap_transactions_status_enum" NOT NULL DEFAULT 'building'
        `);
    await queryRunner.query(`
            ALTER TABLE "swap_transactions"
            ADD "address" character varying NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "swap_transactions"
            ALTER COLUMN "hash" DROP NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "swap_transactions"
            ALTER COLUMN "token_b_amount" DROP NOT NULL
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "swap_transactions"
            ALTER COLUMN "token_b_amount"
            SET NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "swap_transactions"
            ALTER COLUMN "hash"
            SET NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "swap_transactions" DROP COLUMN "address"
        `);
    await queryRunner.query(`
            ALTER TABLE "swap_transactions" DROP COLUMN "status"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."swap_transactions_status_enum"
        `);
  }
}
