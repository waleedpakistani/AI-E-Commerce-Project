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
import { products } from './products.schema';
import { buyers } from './buyers.schema';

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id')
    .notNull()
    .references(() => stores.id, { onDelete: 'cascade' }),
  buyerId: uuid('buyer_id').references(() => buyers.id, {
    onDelete: 'set null',
  }),
  orderNumber: varchar('order_number', { length: 100 }).notNull().unique(),
  customerName: varchar('customer_name', { length: 255 }),
  customerEmail: varchar('customer_email', { length: 255 }),
  shippingAddress: jsonb('shipping_address'),
  paymentMethod: varchar('payment_method', { length: 50 }).notNull().default('COD'),
  paymentStatus: varchar('payment_status', { length: 50 }).notNull().default('PENDING'),
  notes: text('notes'),
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 })
    .notNull()
    .default('0.00'),
  status: varchar('status', { length: 50 }).notNull().default('PENDING'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').references(() => products.id, {
    onDelete: 'set null',
  }),
  productName: varchar('product_name', { length: 255 }).notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  totalPrice: numeric('total_price', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
