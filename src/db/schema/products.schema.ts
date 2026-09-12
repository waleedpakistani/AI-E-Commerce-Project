import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  numeric,
  integer,
  jsonb,
} from 'drizzle-orm/pg-core';
import { stores } from './stores.schema';
import { categories } from './categories.schema';

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id')
    .notNull()
    .references(() => stores.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id').references(() => categories.id, {
    onDelete: 'set null',
  }),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull(),
  description: text('description'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  sku: varchar('sku', { length: 100 }),
  images: jsonb('images').$type<string[]>().default([]),
  status: varchar('status', { length: 50 }).notNull().default('ACTIVE'),
  stockQuantity: integer('stock_quantity').notNull().default(0),
  lowStockThreshold: integer('low_stock_threshold').notNull().default(5),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
