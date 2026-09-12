import { pgTable, uuid, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { buyers } from './buyers.schema';
import { products } from './products.schema';

export const wishlists = pgTable(
  'wishlists',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    buyerId: uuid('buyer_id')
      .notNull()
      .references(() => buyers.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('buyer_product_wishlist_idx').on(table.buyerId, table.productId),
  ],
);

export type Wishlist = typeof wishlists.$inferSelect;
export type NewWishlist = typeof wishlists.$inferInsert;
