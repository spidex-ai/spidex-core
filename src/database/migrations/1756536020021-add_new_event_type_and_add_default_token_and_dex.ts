import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNewEventTypeAndAddDefaultTokenAndDex1756536020021 implements MigrationInterface {
  name = 'AddNewEventTypeAndAddDefaultTokenAndDex1756536020021';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "events"
            ADD "trade_dex" character varying NOT NULL DEFAULT 'ALL_DEX'
        `);
    await queryRunner.query(`
            ALTER TYPE "public"."events_type_enum"
            RENAME TO "events_type_enum_old"
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."events_type_enum" AS ENUM(
                'TRADING_COMPETITION',
                'VOLUME_CHALLENGE',
                'TOKEN_SPECIFIC',
                'DEX_SPECIFIC'
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "events"
            ALTER COLUMN "type" DROP DEFAULT
        `);
    await queryRunner.query(`
            ALTER TABLE "events"
            ALTER COLUMN "type" TYPE "public"."events_type_enum" USING "type"::"text"::"public"."events_type_enum"
        `);
    await queryRunner.query(`
            ALTER TABLE "events"
            ALTER COLUMN "type"
            SET DEFAULT 'TRADING_COMPETITION'
        `);
    await queryRunner.query(`
            DROP TYPE "public"."events_type_enum_old"
        `);
    await queryRunner.query(`
            ALTER TABLE "events"
            ALTER COLUMN "trade_token"
            SET DEFAULT 'ALL_TOKEN'
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "events"
            ALTER COLUMN "trade_token" DROP DEFAULT
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."events_type_enum_old" AS ENUM(
                'TRADING_COMPETITION',
                'VOLUME_CHALLENGE',
                'TOKEN_SPECIFIC'
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "events"
            ALTER COLUMN "type" DROP DEFAULT
        `);
    await queryRunner.query(`
            ALTER TABLE "events"
            ALTER COLUMN "type" TYPE "public"."events_type_enum_old" USING "type"::"text"::"public"."events_type_enum_old"
        `);
    await queryRunner.query(`
            ALTER TABLE "events"
            ALTER COLUMN "type"
            SET DEFAULT 'TRADING_COMPETITION'
        `);
    await queryRunner.query(`
            DROP TYPE "public"."events_type_enum"
        `);
    await queryRunner.query(`
            ALTER TYPE "public"."events_type_enum_old"
            RENAME TO "events_type_enum"
        `);
    await queryRunner.query(`
            ALTER TABLE "events" DROP COLUMN "trade_dex"
        `);
  }
}
