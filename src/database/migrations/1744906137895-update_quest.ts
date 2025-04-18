import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateQuest1744906137895 implements MigrationInterface {
    name = 'UpdateQuest1744906137895'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "swap_transactions"
            ADD "tx_hash" character varying
        `);
        await queryRunner.query(`
            ALTER TYPE "public"."quests_type_enum"
            RENAME TO "quests_type_enum_old"
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."quests_type_enum" AS ENUM(
                '0',
                '1',
                '2',
                '3',
                '10',
                '20',
                '21',
                '30',
                '31',
                '32',
                '33',
                '34',
                '40',
                '41',
                '42',
                '43',
                '44',
                '45',
                '46'
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "quests"
            ALTER COLUMN "type" TYPE "public"."quests_type_enum" USING "type"::"text"::"public"."quests_type_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."quests_type_enum_old"
        `);
        await queryRunner.query(`
            ALTER TABLE "swap_transactions"
            ALTER COLUMN "token_b_amount"
            SET NOT NULL
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_ec977919ee255463bdebe4827a" ON "swap_transactions" ("tx_hash")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_3653d196f2c8688c1333973e6b" ON "swap_transactions" ("tx_hash", "action")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "public"."IDX_3653d196f2c8688c1333973e6b"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_ec977919ee255463bdebe4827a"
        `);
        await queryRunner.query(`
            ALTER TABLE "swap_transactions"
            ALTER COLUMN "token_b_amount" DROP NOT NULL
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."quests_type_enum_old" AS ENUM('0', '1', '2', '3', '10', '20', '30')
        `);
        await queryRunner.query(`
            ALTER TABLE "quests"
            ALTER COLUMN "type" TYPE "public"."quests_type_enum_old" USING "type"::"text"::"public"."quests_type_enum_old"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."quests_type_enum"
        `);
        await queryRunner.query(`
            ALTER TYPE "public"."quests_type_enum_old"
            RENAME TO "quests_type_enum"
        `);
        await queryRunner.query(`
            ALTER TABLE "swap_transactions" DROP COLUMN "tx_hash"
        `);
    }

}
