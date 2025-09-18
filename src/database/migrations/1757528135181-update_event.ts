import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateEvent1757528135181 implements MigrationInterface {
  name = 'UpdateEvent1757528135181';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "events"
            ADD "event_hash" uuid NOT NULL DEFAULT gen_random_uuid()
        `);
    await queryRunner.query(`
            ALTER TABLE "events"
            ADD CONSTRAINT "UQ_8d4472255e7f763258e7fd08035" UNIQUE ("event_hash")
        `);
    await queryRunner.query(`
            ALTER TABLE "events"
            ADD "custom_data" jsonb DEFAULT '{}'
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "events" DROP COLUMN "custom_data"
        `);
    await queryRunner.query(`
            ALTER TABLE "events" DROP CONSTRAINT "UQ_8d4472255e7f763258e7fd08035"
        `);
    await queryRunner.query(`
            ALTER TABLE "events" DROP COLUMN "event_hash"
        `);
  }
}
