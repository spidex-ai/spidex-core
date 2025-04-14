import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateSwapTx1744651393395 implements MigrationInterface {
    name = 'UpdateSwapTx1744651393395'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE INDEX "IDX_7894b7f55930fa1431fecdd5cc" ON "swap_transactions" ("cbor_hex")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "public"."IDX_7894b7f55930fa1431fecdd5cc"
        `);
    }

}
