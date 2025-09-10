import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateEvent1757531076406 implements MigrationInterface {
  name = 'UpdateEvent1757531076406';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "events"
            ADD "prize_token" character varying
        `);
    await queryRunner.query(`
            ALTER TABLE "events"
            ALTER COLUMN "event_hash" DROP DEFAULT
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "events"
            ALTER COLUMN "event_hash"
            SET DEFAULT uuid_generate_v4()
        `);
    await queryRunner.query(`
            ALTER TABLE "events" DROP COLUMN "prize_token"
        `);
  }
}
