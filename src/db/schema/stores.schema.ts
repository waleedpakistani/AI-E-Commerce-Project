import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

import { sellers } from './sellers.schema';

export const stores = pgTable('stores', {
  id: uuid('id').primaryKey().defaultRandom(),

  sellerId: uuid('seller_id')
    .notNull()
    .references(() => sellers.id, {
      onDelete: 'cascade',
    }),

  name: varchar('name', { length: 255 }).notNull(),

  slug: varchar('slug', { length: 255 })
    .notNull()
    .unique(),

  description: text('description'),

  logoUrl: text('logo_url'),

  status: varchar('status', { length: 50 })
    .notNull()
    .default('ACTIVE'),

  createdAt: timestamp('created_at')
    .notNull()
    .defaultNow(),

  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow(),
});

export type Store = typeof stores.$inferSelect;
export type NewStore = typeof stores.$inferInsert;