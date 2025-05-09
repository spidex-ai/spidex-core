import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateQuest1746794079904 implements MigrationInterface {
    name = 'UpdateQuest1746794079904'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TYPE "public"."quests_type_enum"
            RENAME TO "quests_type_enum_old"
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."quests_type_enum" AS ENUM('0', '1', '2', '3', '10', '20', '32', '41')
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
                '10',
                '20',
                '21',
                '30',
                '31',
                '32',
                '33',
                '34',
                '40',
                '41',
                '42',
                '43',
                '44',
                '45',
                '46'
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
    }

}
