import { createHash } from 'crypto';

const hashQuery = (query: unknown): string =>
  createHash('sha1').update(JSON.stringify(query ?? {})).digest('hex');

export const CacheKeys = {
  store: (storeId: string) => `cache:store:${storeId}`,
  sellerStoreList: (sellerId: string) => `cache:seller-stores:${sellerId}:list`,
  sellerStoreListPattern: (sellerId: string) =>
    `cache:seller-stores:${sellerId}:*`,
  categoriesByStore: (storeId: string) => `cache:categories:store:${storeId}`,
  category: (categoryId: string) => `cache:category:${categoryId}`,
  product: (productId: string) => `cache:product:${productId}`,
  productPattern: () => 'cache:product:*',
  buyerProduct: (productId: string) => `cache:buyer-product:${productId}`,
  buyerProductPattern: () => 'cache:buyer-product:*',
  sellerProducts: (storeId: string, query?: unknown) =>
    `cache:products:store:${storeId}:${hashQuery(query)}`,
  sellerProductsPattern: (storeId: string) =>
    `cache:products:store:${storeId}:*`,
  inventory: (storeId: string) => `cache:products:inventory:${storeId}`,
  lowStock: (storeId: string) => `cache:products:low-stock:${storeId}`,
  buyerProducts: (query?: unknown) => `cache:buyer-products:${hashQuery(query)}`,
  buyerProductsPattern: () => 'cache:buyer-products:*',
  cart: (buyerId: string) => `cache:cart:${buyerId}`,
  cartPattern: () => 'cache:cart:*',
};