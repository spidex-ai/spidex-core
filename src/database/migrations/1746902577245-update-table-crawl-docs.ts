import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateTableCrawlDocs1746902577245 implements MigrationInterface {
  name = 'UpdateTableCrawlDocs1746902577245';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "crawl_docs"
            ADD "is_crawl_sub_path" boolean NOT NULL DEFAULT false
        `);
    await queryRunner.query(`
            ALTER TABLE "crawl_docs"
            ADD "path_count" integer NOT NULL DEFAULT '1'
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "crawl_docs" DROP COLUMN "path_count"
        `);
    await queryRunner.query(`
            ALTER TABLE "crawl_docs" DROP COLUMN "is_crawl_sub_path"
        `);
  }
}
