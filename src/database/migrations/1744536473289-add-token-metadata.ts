import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTokenMetadata1744536473289 implements MigrationInterface {
  name = 'AddTokenMetadata1744536473289';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "token_metadata"
            ALTER COLUMN "name" DROP NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "token_metadata"
            ALTER COLUMN "policy" DROP NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "token_metadata"
            ALTER COLUMN "ticker" DROP NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "token_metadata"
            ALTER COLUMN "decimals" DROP NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "token_metadata"
            ALTER COLUMN "logo" DROP NOT NULL
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "token_metadata"
            ALTER COLUMN "logo"
            SET NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "token_metadata"
            ALTER COLUMN "decimals"
            SET NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "token_metadata"
            ALTER COLUMN "ticker"
            SET NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "token_metadata"
            ALTER COLUMN "policy"
            SET NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "token_metadata"
            ALTER COLUMN "name"
            SET NOT NULL
        `);
  }
}
