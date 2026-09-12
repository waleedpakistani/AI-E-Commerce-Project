import { relations } from 'drizzle-orm';
import { sellers } from './sellers.schema';
import { stores } from './stores.schema';
import { categories } from './categories.schema';
import { products } from './products.schema';
import { orders, orderItems } from './orders.schema';
import { buyers } from './buyers.schema';
import { buyerAddresses } from './addresses.schema';
import { wishlists } from './wishlists.schema';
import { cartItems } from './carts.schema';
import { reviews } from './reviews.schema';

export const sellersRelations = relations(sellers, ({ many }) => ({
  stores: many(stores),
}));

export const storesRelations = relations(stores, ({ one, many }) => ({
  seller: one(sellers, {
    fields: [stores.sellerId],
    references: [sellers.id],
  }),
  categories: many(categories),
  products: many(products),
  orders: many(orders),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  store: one(stores, {
    fields: [categories.storeId],
    references: [stores.id],
  }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  store: one(stores, {
    fields: [products.storeId],
    references: [stores.id],
  }),
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  orderItems: many(orderItems),
  wishlists: many(wishlists),
  cartItems: many(cartItems),
  reviews: many(reviews),
}));

export const buyersRelations = relations(buyers, ({ many }) => ({
  addresses: many(buyerAddresses),
  wishlists: many(wishlists),
  cartItems: many(cartItems),
  orders: many(orders),
  reviews: many(reviews),
}));

export const buyerAddressesRelations = relations(buyerAddresses, ({ one }) => ({
  buyer: one(buyers, {
    fields: [buyerAddresses.buyerId],
    references: [buyers.id],
  }),
}));

export const wishlistsRelations = relations(wishlists, ({ one }) => ({
  buyer: one(buyers, {
    fields: [wishlists.buyerId],
    references: [buyers.id],
  }),
  product: one(products, {
    fields: [wishlists.productId],
    references: [products.id],
  }),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  buyer: one(buyers, {
    fields: [cartItems.buyerId],
    references: [buyers.id],
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  store: one(stores, {
    fields: [orders.storeId],
    references: [stores.id],
  }),
  buyer: one(buyers, {
    fields: [orders.buyerId],
    references: [buyers.id],
  }),
  items: many(orderItems),
  reviews: many(reviews),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  buyer: one(buyers, {
    fields: [reviews.buyerId],
    references: [buyers.id],
  }),
  product: one(products, {
    fields: [reviews.productId],
    references: [products.id],
  }),
  order: one(orders, {
    fields: [reviews.orderId],
    references: [orders.id],
  }),
}));
