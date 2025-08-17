import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserActivities1754117017168 implements MigrationInterface {
    name = 'AddUserActivities1754117017168'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "user_activities" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                "user_id" integer NOT NULL,
                "timestamp" TIMESTAMP NOT NULL DEFAULT now(),
                "activity_date" date NOT NULL DEFAULT ('now'::text)::date,
                "endpoint" character varying,
                "method" character varying,
                "user_agent" character varying,
                "ip_address" character varying,
                CONSTRAINT "PK_1245d4d2cf04ba7743f2924d951" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_user_activity_dau" ON "user_activities" ("activity_date")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_user_activity_mau" ON "user_activities" ("activity_date", "user_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_user_activity_timestamp" ON "user_activities" ("timestamp")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_user_activity_date" ON "user_activities" ("activity_date")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_user_activity_user_date" ON "user_activities" ("user_id", "activity_date")
        `);
        await queryRunner.query(`
            ALTER TABLE "user_activities"
            ADD CONSTRAINT "FK_a283f37e08edf5e37d38b375eec" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user_activities" DROP CONSTRAINT "FK_a283f37e08edf5e37d38b375eec"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_user_activity_user_date"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_user_activity_date"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_user_activity_timestamp"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_user_activity_mau"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_user_activity_dau"
        `);
        await queryRunner.query(`
            DROP TABLE "user_activities"
        `);
    }

}
