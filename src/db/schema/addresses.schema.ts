import { pgTable, uuid, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { buyers } from './buyers.schema';

export const buyerAddresses = pgTable('buyer_addresses', {
  id: uuid('id').primaryKey().defaultRandom(),
  buyerId: uuid('buyer_id')
    .notNull()
    .references(() => buyers.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 100 }).notNull().default('Home'),
  recipientName: varchar('recipient_name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }).notNull(),
  addressLine1: text('address_line1').notNull(),
  addressLine2: text('address_line2'),
  city: varchar('city', { length: 100 }).notNull(),
  state: varchar('state', { length: 100 }),
  postalCode: varchar('postal_code', { length: 20 }).notNull(),
  country: varchar('country', { length: 100 }).notNull(),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type BuyerAddress = typeof buyerAddresses.$inferSelect;
export type NewBuyerAddress = typeof buyerAddresses.$inferInsert;
