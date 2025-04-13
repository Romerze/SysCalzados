import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';

// Cargar variables de entorno desde .env
config();

export const AppDataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  synchronize: false, // NUNCA usar synchronize: true en producción o con migraciones
  logging: false, // Puedes ponerlo en true para depurar SQL
  entities: [
     __dirname + '/../**/*.entity{.ts,.js}' // Ruta a todas las entidades (compiladas y fuente)
    ],
  migrations: [
    __dirname + '/database/migrations/*{.ts,.js}' // Ruta a las migraciones
    ],
  // subscribers: [], // Si tienes subscribers
  // migrationsTableName: "custom_migration_table", // Nombre personalizado si lo deseas
};

// Crear y exportar la instancia de DataSource
export const AppDataSource = new DataSource(AppDataSourceOptions); 