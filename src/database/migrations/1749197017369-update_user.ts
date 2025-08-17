import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateUser1749197017369 implements MigrationInterface {
  name = 'UpdateUser1749197017369';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "users"
            ADD "discord_id" character varying
        `);
    await queryRunner.query(`
            ALTER TABLE "users"
            ADD "discord_username" character varying
        `);
    await queryRunner.query(`
            ALTER TABLE "users"
            ADD "telegram_id" character varying
        `);
    await queryRunner.query(`
            ALTER TABLE "users"
            ADD "telegram_username" character varying
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_79e7662bab6caee398a24bf4e3" ON "users" ("discord_id")
            WHERE discord_id IS NOT NULL
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_5469a0476bbc7b94dc7bae045e" ON "users" ("telegram_id")
            WHERE telegram_id IS NOT NULL
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "public"."IDX_5469a0476bbc7b94dc7bae045e"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_79e7662bab6caee398a24bf4e3"
        `);
    await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "telegram_username"
        `);
    await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "telegram_id"
        `);
    await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "discord_username"
        `);
    await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "discord_id"
        `);
  }
}
