import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEventTable1753106557182 implements MigrationInterface {
    name = 'AddEventTable1753106557182'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "public"."IDX_user_referrals_referred_by_deleted_at"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_user_referrals_referred_by"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_user_points_amount_updated_at"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_user_points_user_id"
        `);
        await queryRunner.query(`
            CREATE TABLE "event_participants" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                "event_id" integer NOT NULL,
                "user_id" integer NOT NULL,
                "total_volume" numeric(36, 18) NOT NULL DEFAULT '0',
                "trade_count" integer NOT NULL DEFAULT '0',
                "rank" integer,
                "prize_claimed" boolean NOT NULL DEFAULT false,
                "prize_claimed_at" TIMESTAMP,
                "joined_at" TIMESTAMP NOT NULL DEFAULT now(),
                "last_trade_at" TIMESTAMP,
                CONSTRAINT "UQ_EVENT_PARTICIPANT" UNIQUE ("event_id", "user_id"),
                CONSTRAINT "PK_b65ffd558d76fd51baffe81d42b" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_9fe1614b1b44cb8d60397e9265" ON "event_participants" ("rank")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_6483bebe38de74c9a2c20672d9" ON "event_participants" ("total_volume")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_badb99ed7e07532bba1315a8af" ON "event_participants" ("event_id", "user_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_ce3f433e47fdd8f072964293c8" ON "event_participants" ("user_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_b5349807aae71193d0cc0f52e3" ON "event_participants" ("event_id")
        `);
        await queryRunner.query(`
            CREATE TABLE "event_rank_prizes" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                "event_id" integer NOT NULL,
                "rank_from" integer NOT NULL,
                "rank_to" integer NOT NULL,
                "prize_points" numeric(36, 18) NOT NULL DEFAULT '0',
                "prize_token" character varying,
                "prize_token_amount" numeric(36, 18),
                "description" character varying,
                CONSTRAINT "PK_48bd27e1dbf728c7c30522230b4" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_0a3921a1ba72a5f81e6bef6792" ON "event_rank_prizes" ("rank_from", "rank_to")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_42d18a20edc5a4c565ca9efb9e" ON "event_rank_prizes" ("event_id")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."events_status_enum" AS ENUM(
                'DRAFT',
                'ACTIVE',
                'ENDED',
                'CANCELLED',
                'PRIZES_DISTRIBUTED'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."events_type_enum" AS ENUM(
                'TRADING_COMPETITION',
                'VOLUME_CHALLENGE',
                'TOKEN_SPECIFIC'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "events" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                "name" character varying(255) NOT NULL,
                "description" text NOT NULL,
                "total_prize" numeric(36, 18) NOT NULL,
                "start_date" TIMESTAMP NOT NULL,
                "end_date" TIMESTAMP NOT NULL,
                "status" "public"."events_status_enum" NOT NULL DEFAULT 'DRAFT',
                "type" "public"."events_type_enum" NOT NULL DEFAULT 'TRADING_COMPETITION',
                "trade_tokens" jsonb NOT NULL,
                "prize_config" jsonb,
                "created_by" integer,
                "icon" character varying,
                CONSTRAINT "PK_40731c7151fe4be3116e45ddf73" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_7ebab07668bb225b6a04782a7d" ON "events" ("created_at")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_e13c67b079be558c1484ed3d48" ON "events" ("end_date")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_ce5225c17497c5adddc1819c69" ON "events" ("start_date")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_03dcebc1ab44daa177ae9479c4" ON "events" ("status")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."event_trades_trade_type_enum" AS ENUM('BUY', 'SELL')
        `);
        await queryRunner.query(`
            CREATE TABLE "event_trades" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                "event_id" integer NOT NULL,
                "participant_id" integer NOT NULL,
                "swap_transaction_id" integer NOT NULL,
                "volume_usd" numeric(36, 18) NOT NULL,
                "token_traded" character varying NOT NULL,
                "token_amount" numeric(36, 18) NOT NULL,
                "trade_type" "public"."event_trades_trade_type_enum" NOT NULL,
                "recorded_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_9b9e546f5f07529ad02740a2f65" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_e844ca940e61461aadfcb658d8" ON "event_trades" ("token_traded")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_ac7a47068f51f79b8941c1ecb5" ON "event_trades" ("volume_usd")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_2ef809a7c5d2f55b8ac2500cfe" ON "event_trades" ("swap_transaction_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_aa7a9594d1e3dc30c97286fc7a" ON "event_trades" ("participant_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_ddb39b00f9635f1d92d8c8abb0" ON "event_trades" ("event_id")
        `);
        await queryRunner.query(`
            ALTER TABLE "event_participants"
            ADD CONSTRAINT "FK_b5349807aae71193d0cc0f52e35" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "event_participants"
            ADD CONSTRAINT "FK_ce3f433e47fdd8f072964293c8d" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "event_rank_prizes"
            ADD CONSTRAINT "FK_42d18a20edc5a4c565ca9efb9ec" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "events"
            ADD CONSTRAINT "FK_1a259861a2ce114f074b366eed2" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "event_trades"
            ADD CONSTRAINT "FK_ddb39b00f9635f1d92d8c8abb0d" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "event_trades"
            ADD CONSTRAINT "FK_aa7a9594d1e3dc30c97286fc7a2" FOREIGN KEY ("participant_id") REFERENCES "event_participants"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "event_trades"
            ADD CONSTRAINT "FK_2ef809a7c5d2f55b8ac2500cfe9" FOREIGN KEY ("swap_transaction_id") REFERENCES "swap_transactions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "event_trades" DROP CONSTRAINT "FK_2ef809a7c5d2f55b8ac2500cfe9"
        `);
        await queryRunner.query(`
            ALTER TABLE "event_trades" DROP CONSTRAINT "FK_aa7a9594d1e3dc30c97286fc7a2"
        `);
        await queryRunner.query(`
            ALTER TABLE "event_trades" DROP CONSTRAINT "FK_ddb39b00f9635f1d92d8c8abb0d"
        `);
        await queryRunner.query(`
            ALTER TABLE "events" DROP CONSTRAINT "FK_1a259861a2ce114f074b366eed2"
        `);
        await queryRunner.query(`
            ALTER TABLE "event_rank_prizes" DROP CONSTRAINT "FK_42d18a20edc5a4c565ca9efb9ec"
        `);
        await queryRunner.query(`
            ALTER TABLE "event_participants" DROP CONSTRAINT "FK_ce3f433e47fdd8f072964293c8d"
        `);
        await queryRunner.query(`
            ALTER TABLE "event_participants" DROP CONSTRAINT "FK_b5349807aae71193d0cc0f52e35"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_ddb39b00f9635f1d92d8c8abb0"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_aa7a9594d1e3dc30c97286fc7a"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_2ef809a7c5d2f55b8ac2500cfe"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_ac7a47068f51f79b8941c1ecb5"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_e844ca940e61461aadfcb658d8"
        `);
        await queryRunner.query(`
            DROP TABLE "event_trades"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."event_trades_trade_type_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_03dcebc1ab44daa177ae9479c4"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_ce5225c17497c5adddc1819c69"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_e13c67b079be558c1484ed3d48"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_7ebab07668bb225b6a04782a7d"
        `);
        await queryRunner.query(`
            DROP TABLE "events"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."events_type_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."events_status_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_42d18a20edc5a4c565ca9efb9e"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_0a3921a1ba72a5f81e6bef6792"
        `);
        await queryRunner.query(`
            DROP TABLE "event_rank_prizes"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_b5349807aae71193d0cc0f52e3"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_ce3f433e47fdd8f072964293c8"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_badb99ed7e07532bba1315a8af"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_6483bebe38de74c9a2c20672d9"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_9fe1614b1b44cb8d60397e9265"
        `);
        await queryRunner.query(`
            DROP TABLE "event_participants"
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_user_points_user_id" ON "user_points" ("user_id")
            WHERE (deleted_at IS NULL)
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_user_points_amount_updated_at" ON "user_points" ("updated_at", "amount")
            WHERE (deleted_at IS NULL)
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_user_referrals_referred_by" ON "user_referrals" ("referred_by")
            WHERE (deleted_at IS NULL)
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_user_referrals_referred_by_deleted_at" ON "user_referrals" ("deleted_at", "referred_by")
        `);
    }

}
