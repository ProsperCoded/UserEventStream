import { pgTable, uuid, varchar, timestamp, text } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  lastIpAddress: varchar('last_ip_address', { length: 45 }), // IPv6 support
  status: varchar('status', { length: 20 }).default('active').notNull(), // 'active', 'suspended'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
