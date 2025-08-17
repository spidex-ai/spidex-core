import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateSwapTx1744650832561 implements MigrationInterface {
  name = 'UpdateSwapTx1744650832561';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "swap_transactions"
            ADD "cbor_hex" text NOT NULL
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_47b571253643dfde2ec21b4e47" ON "swap_transactions" ("cbor_hex", "action")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "public"."IDX_47b571253643dfde2ec21b4e47"
        `);
    await queryRunner.query(`
            ALTER TABLE "swap_transactions" DROP COLUMN "cbor_hex"
        `);
  }
}
