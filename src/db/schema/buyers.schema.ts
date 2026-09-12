import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';

export const buyers = pgTable('buyers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password').notNull(),
  phone: varchar('phone', { length: 50 }),
  role: varchar('role', { length: 50 }).notNull().default('BUYER'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Buyer = typeof buyers.$inferSelect;
export type NewBuyer = typeof buyers.$inferInsert;
