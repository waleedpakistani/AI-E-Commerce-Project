import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const sellers = pgTable('sellers', {
  id: uuid('id').primaryKey().defaultRandom(),

  name: varchar('name', { length: 255 }).notNull(),

  email: varchar('email', { length: 255 })
    .notNull()
    .unique(),

  password: text('password').notNull(),

  phone: varchar('phone', { length: 30 }).notNull(),

  role: varchar('role', { length: 50 })
    .notNull()
    .default('SELLER'),

  createdAt: timestamp('created_at')
    .notNull()
    .defaultNow(),

  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow(),
});

export type Seller = typeof sellers.$inferSelect;
export type NewSeller = typeof sellers.$inferInsert;