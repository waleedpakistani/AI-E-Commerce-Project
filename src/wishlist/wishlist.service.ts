import {
  Injectable,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { DRIZZLE } from '../db/database.types';
import { wishlists } from '../db/schema/wishlists.schema';
import { products } from '../db/schema/products.schema';
import { stores } from '../db/schema/stores.schema';
import { categories } from '../db/schema/categories.schema';

@Injectable()
export class WishlistService {
  constructor(@Inject(DRIZZLE) private readonly db: any) {}

  async addToWishlist(buyerId: string, productId: string) {
    const [product] = await this.db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const [existing] = await this.db
      .select()
      .from(wishlists)
      .where(
        and(eq(wishlists.buyerId, buyerId), eq(wishlists.productId, productId)),
      )
      .limit(1);

    if (existing) {
      return { message: 'Product is already in wishlist', wishlist: existing };
    }

    const [item] = await this.db
      .insert(wishlists)
      .values({
        buyerId,
        productId,
      })
      .returning();

    return { message: 'Product added to wishlist', wishlist: item };
  }

  async removeFromWishlist(buyerId: string, productId: string) {
    const deleted = await this.db
      .delete(wishlists)
      .where(
        and(eq(wishlists.buyerId, buyerId), eq(wishlists.productId, productId)),
      )
      .returning();

    if (deleted.length === 0) {
      throw new NotFoundException('Product not found in wishlist');
    }

    return { message: 'Product removed from wishlist' };
  }

  async getWishlist(buyerId: string) {
    const items = await this.db
      .select({
        wishlistId: wishlists.id,
        addedAt: wishlists.createdAt,
        product: products,
        storeName: stores.name,
        categoryName: categories.name,
      })
      .from(wishlists)
      .innerJoin(products, eq(wishlists.productId, products.id))
      .leftJoin(stores, eq(products.storeId, stores.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(wishlists.buyerId, buyerId))
      .orderBy(desc(wishlists.createdAt));

    return items.map((row: any) => ({
      id: row.wishlistId,
      productId: row.product.id,
      createdAt: row.addedAt,
      product: {
        id: row.product.id,
        name: row.product.name,
        slug: row.product.slug,
        description: row.product.description,
        price: Number(row.product.price),
        images: row.product.images,
        stockQuantity: row.product.stockQuantity,
        status: row.product.status,
        store: {
          id: row.product.storeId,
          name: row.storeName,
        },
        category: row.product.categoryId
          ? {
              id: row.product.categoryId,
              name: row.categoryName,
            }
          : null,
      },
    }));
  }
}
