// src/interfaces/db/mysql-client.js
import { Sequelize } from 'sequelize';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '..', '..', '.env') });

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = Number(process.env.DB_PORT || 3306);
const DB_USER = process.env.DB_USER || process.env.DB_USERNAME || '';
const DB_PASS = process.env.DB_PASS || process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || '';

if (!DB_USER || !DB_NAME) {
  console.error('[db] ERROR: DB_USER y/o DB_NAME están vacíos. Revisa .env');
  process.exit(1);
}

export const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'mysql',
  logging: false,
  dialectOptions: {
    charset: 'utf8mb4',
  },
  define: {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
  },
});
