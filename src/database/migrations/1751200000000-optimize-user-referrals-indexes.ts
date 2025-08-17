import { MigrationInterface, QueryRunner } from 'typeorm';

export class OptimizeUserReferralsIndexes1751200000000 implements MigrationInterface {
  name = 'OptimizeUserReferralsIndexes1751200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add composite index for referred_by and deleted_at for optimal leaderboard query performance
    await queryRunner.query(`
      CREATE INDEX "IDX_user_referrals_referred_by_deleted_at" 
      ON "user_referrals" ("referred_by", "deleted_at")
    `);

    // Add index on referred_by alone for general referral queries
    await queryRunner.query(`
      CREATE INDEX "IDX_user_referrals_referred_by" 
      ON "user_referrals" ("referred_by") 
      WHERE "deleted_at" IS NULL
    `);

    // Add index on user_points amount and updated_at for leaderboard ordering
    await queryRunner.query(`
      CREATE INDEX "IDX_user_points_amount_updated_at" 
      ON "user_points" ("amount" DESC, "updated_at" DESC)
      WHERE "deleted_at" IS NULL
    `);

    // Add index on user_points user_id for joins
    await queryRunner.query(`
      CREATE INDEX "IDX_user_points_user_id" 
      ON "user_points" ("user_id")
      WHERE "deleted_at" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "public"."IDX_user_points_user_id"
    `);
    
    await queryRunner.query(`
      DROP INDEX "public"."IDX_user_points_amount_updated_at"
    `);
    
    await queryRunner.query(`
      DROP INDEX "public"."IDX_user_referrals_referred_by"
    `);
    
    await queryRunner.query(`
      DROP INDEX "public"."IDX_user_referrals_referred_by_deleted_at"
    `);
  }
}
