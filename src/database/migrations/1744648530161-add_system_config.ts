import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSystemConfig1744648530161 implements MigrationInterface {
    name = 'AddSystemConfig1744648530161'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "system_config" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "key" character varying NOT NULL,
                "value" jsonb NOT NULL,
                "description" character varying,
                CONSTRAINT "UQ_eedd3cd0f227c7fb5eff2204e93" UNIQUE ("key"),
                CONSTRAINT "PK_db4e70ac0d27e588176e9bb44a0" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_eedd3cd0f227c7fb5eff2204e9" ON "system_config" ("key")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "public"."IDX_eedd3cd0f227c7fb5eff2204e9"
        `);
        await queryRunner.query(`
            DROP TABLE "system_config"
        `);
    }

}
