import { config } from 'dotenv';
import { join } from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';
config();

export const dataSourceOptions: DataSourceOptions & { seeds: string[]; factories: string[] } = {
  type: process.env.DB_TYPE as any,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [join(__dirname, 'database/entities', '*.entity.{ts,js}')],
  migrationsTableName: 'custom_migration_table',
  migrations: [join(__dirname, 'database/migrations', '*.{ts,js}')],
  seeds: [join(__dirname, 'database/seeds', '*.{ts,js}')],
  factories: [join(__dirname, 'database/factories', '*.{ts,js}')],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development' ? true : false,
  ssl: process.env.DB_SSL_ENABLED === 'true' ? true : false,
  extra: { decimalNumbers: true },
  cache: true,
};

export const AppDataSource = new DataSource(dataSourceOptions);

export default dataSourceOptions;
