import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTokenMetadata1744536327017 implements MigrationInterface {
    name = 'AddTokenMetadata1744536327017'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "token_metadata" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "unit" character varying NOT NULL,
                "name" character varying NOT NULL,
                "policy" character varying NOT NULL,
                "description" character varying,
                "url" character varying,
                "ticker" character varying NOT NULL,
                "decimals" integer NOT NULL,
                "logo" character varying NOT NULL,
                CONSTRAINT "UQ_e8cd85bd1bf02c9c6821fc1d79b" UNIQUE ("unit"),
                CONSTRAINT "PK_69858f47995fd449579fa325054" PRIMARY KEY ("id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE "token_metadata"
        `);
    }

}
