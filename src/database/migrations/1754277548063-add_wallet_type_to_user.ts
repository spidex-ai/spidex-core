import { MigrationInterface, QueryRunner } from "typeorm";

export class AddWalletTypeToUser1754277548063 implements MigrationInterface {
    name = 'AddWalletTypeToUser1754277548063'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD "last_used_wallet" character varying
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "last_used_wallet"
        `);
    }

}
