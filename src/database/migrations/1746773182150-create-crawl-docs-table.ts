import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCrawlDocsTable1746773182150 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE crawl_docs (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) ,
                category VARCHAR(255) ,
                url VARCHAR(255) NOT NULL,
                status VARCHAR(255) NOT NULL default 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS crawl_docs;`);
  }
}
