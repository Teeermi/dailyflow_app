import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSlackWebhook1740999000000 implements MigrationInterface {
  name = 'AddSlackWebhook1740999000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`users\`
      ADD COLUMN \`slackWebhookUrl\` varchar(500) NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`users\`
      DROP COLUMN \`slackWebhookUrl\`
    `);
  }
}
