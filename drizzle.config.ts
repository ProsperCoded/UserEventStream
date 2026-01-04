import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './apps/producer-api/src/database/schema.ts',
  out: './apps/producer-api/drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    host: process.env.DATABASE_HOST || 'localhost',
    user: process.env.DATABASE_USER || 'user',
    password: process.env.DATABASE_PASSWORD || 'password',
    database: process.env.DATABASE_NAME || 'user_event_stream',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    ssl: false,
  },
});
