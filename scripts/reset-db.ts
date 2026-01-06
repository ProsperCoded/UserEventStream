// import 'dotenv/config';
import { reset } from 'drizzle-seed';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../apps/producer-api/src/database/schema';

const pool = new Pool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5433'),
  user: process.env.DATABASE_USER || 'user',
  password: process.env.DATABASE_PASSWORD || 'password',
  database: process.env.DATABASE_NAME || 'user_event_stream',
});

const db = drizzle(pool, { schema });

async function clearDatabase() {
  console.log('Clearing database...');
  await reset(db, schema);
  console.log('Database cleared.');
  await pool.end();
}

clearDatabase();
