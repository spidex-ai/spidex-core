import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuthNonceTable1750488269170 implements MigrationInterface {
  name = 'AddAuthNonceTable1750488269170';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "public"."auth_nonces_status_enum" AS ENUM('ACTIVE', 'USED', 'EXPIRED')
        `);
    await queryRunner.query(`
            CREATE TABLE "auth_nonces" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "nonce" character varying NOT NULL,
                "wallet_address" character varying NOT NULL,
                "status" "public"."auth_nonces_status_enum" NOT NULL DEFAULT 'ACTIVE',
                "expires_at" TIMESTAMP NOT NULL,
                "challenge_message" character varying NOT NULL,
                "used_at" TIMESTAMP,
                CONSTRAINT "UQ_a7080c443def2e46ba5c4b87f38" UNIQUE ("nonce"),
                CONSTRAINT "PK_43f4e702fc79d337c03bce1de16" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_9efdf3ceb5219ac7f814fcb33c" ON "auth_nonces" ("expires_at")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_146c8571f3630f51274e0c4954" ON "auth_nonces" ("wallet_address", "status")
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_a7080c443def2e46ba5c4b87f3" ON "auth_nonces" ("nonce")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "public"."IDX_a7080c443def2e46ba5c4b87f3"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_146c8571f3630f51274e0c4954"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_9efdf3ceb5219ac7f814fcb33c"
        `);
    await queryRunner.query(`
            DROP TABLE "auth_nonces"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."auth_nonces_status_enum"
        `);
  }
}
