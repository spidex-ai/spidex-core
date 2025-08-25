import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFauvoriteToken1756132755924 implements MigrationInterface {
  name = 'AddFauvoriteToken1756132755924';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "favourite_tokens" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "user_id" integer NOT NULL,
                "token_id" character varying NOT NULL,
                CONSTRAINT "PK_4cb84963470fc81837420663539" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_745f768f2218a46b106f94475b" ON "favourite_tokens" ("user_id", "token_id")
        `);
    await queryRunner.query(`
            ALTER TABLE "favourite_tokens"
            ADD CONSTRAINT "FK_6f32819f7c764786d87f0c6a3ce" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "favourite_tokens" DROP CONSTRAINT "FK_6f32819f7c764786d87f0c6a3ce"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_745f768f2218a46b106f94475b"
        `);
    await queryRunner.query(`
            DROP TABLE "favourite_tokens"
        `);
  }
}
