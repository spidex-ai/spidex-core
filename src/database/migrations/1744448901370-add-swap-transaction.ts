import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSwapTransaction1744448901370 implements MigrationInterface {
  name = 'AddSwapTransaction1744448901370';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "public"."swap_transactions_action_enum" AS ENUM('buy', 'sell')
        `);
    await queryRunner.query(`
            CREATE TABLE "swap_transactions" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "action" "public"."swap_transactions_action_enum" NOT NULL,
                "user_id" integer NOT NULL,
                "exchange" character varying NOT NULL,
                "hash" character varying NOT NULL,
                "lp_token_unit" character varying NOT NULL,
                "price" numeric(36, 18) NOT NULL,
                "timestamp" TIMESTAMP NOT NULL DEFAULT now(),
                "token_a" character varying,
                "token_a_amount" numeric(36, 18) NOT NULL,
                "token_a_name" character varying NOT NULL,
                "token_b" character varying,
                "token_b_amount" numeric(36, 18) NOT NULL,
                "token_b_name" character varying NOT NULL,
                CONSTRAINT "PK_1aa502020ff2dcb5a6628e087cb" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            ALTER TYPE "public"."quests_type_enum"
            RENAME TO "quests_type_enum_old"
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."quests_type_enum" AS ENUM('0', '1', '2', '3', '10', '20', '30')
        `);
    await queryRunner.query(`
            ALTER TABLE "quests"
            ALTER COLUMN "type" TYPE "public"."quests_type_enum" USING "type"::"text"::"public"."quests_type_enum"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."quests_type_enum_old"
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "public"."quests_type_enum_old" AS ENUM(
                '0',
                '1',
                '2',
                '3',
                '4',
                '5',
                '6',
                '10',
                '20',
                '21'
            )
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
            DROP TABLE "swap_transactions"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."swap_transactions_action_enum"
        `);
  }
}
