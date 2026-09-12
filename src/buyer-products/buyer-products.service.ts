import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { eq, and, or, ilike, gte, lte, gt, sql, desc, asc } from 'drizzle-orm';
import { DRIZZLE } from '../db/database.types';
import { products } from '../db/schema/products.schema';
import { categories } from '../db/schema/categories.schema';
import { stores } from '../db/schema/stores.schema';
import { reviews } from '../db/schema/reviews.schema';
import { BuyerQueryProductsDto, ProductSortBy } from './dto/buyer-query-products.dto';
import { RedisService } from '../common/redis/redis.service';
import { CacheKeys } from '../common/redis/cache.keys';
import { BUYER_PRODUCT_CACHE_TTL } from '../common/redis/cache.constants';

@Injectable()
export class BuyerProductsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: any,
    private readonly redisService: RedisService,
  ) {}

  async getProducts(query: BuyerQueryProductsDto) {
    const cacheKey = CacheKeys.buyerProducts(query);
    const cached = await this.redisService.getJson<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const {
      search,
      categoryId,
      storeId,
      minPrice,
      maxPrice,
      inStockOnly,
      sortBy,
      page = 1,
      limit = 10,
    } = query;

    const conditions: any[] = [eq(products.status, 'ACTIVE')];

    if (search) {
      conditions.push(
        or(
          ilike(products.name, `%${search}%`),
          ilike(products.description, `%${search}%`),
        ),
      );
    }

    if (categoryId) {
      conditions.push(eq(products.categoryId, categoryId));
    }

    if (storeId) {
      conditions.push(eq(products.storeId, storeId));
    }

    if (minPrice !== undefined) {
      conditions.push(gte(products.price, minPrice.toString()));
    }

    if (maxPrice !== undefined) {
      conditions.push(lte(products.price, maxPrice.toString()));
    }

    if (inStockOnly) {
      conditions.push(gt(products.stockQuantity, 0));
    }

    const whereClause = and(...conditions);

    // Get total count
    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(whereClause);

    const total = countResult?.count || 0;
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;

    let orderByClause;
    switch (sortBy) {
      case ProductSortBy.PRICE_ASC:
        orderByClause = asc(products.price);
        break;
      case ProductSortBy.PRICE_DESC:
        orderByClause = desc(products.price);
        break;
      case ProductSortBy.NEWEST:
      default:
        orderByClause = desc(products.createdAt);
        break;
    }

    const rawProducts = await this.db
      .select({
        product: products,
        categoryName: categories.name,
        storeName: stores.name,
        storeSlug: stores.slug,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(stores, eq(products.storeId, stores.id))
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    // Fetch review ratings aggregation for these products
    const productIds = rawProducts.map((p: any) => p.product.id);

    const reviewAggregates: Record<string, { avgRating: number; reviewCount: number }> = {};

    if (productIds.length > 0) {
      const reviewStats = await this.db
        .select({
          productId: reviews.productId,
          avgRating: sql<number>`round(avg(${reviews.rating})::numeric, 1)::float`,
          reviewCount: sql<number>`count(${reviews.id})::int`,
        })
        .from(reviews)
        .where(sql`${reviews.productId} IN ${productIds}`)
        .groupBy(reviews.productId);

      for (const stat of reviewStats) {
        reviewAggregates[stat.productId] = {
          avgRating: stat.avgRating || 0,
          reviewCount: stat.reviewCount || 0,
        };
      }
    }

    const items = rawProducts.map((row: any) => {
      const p = row.product;
      const stats = reviewAggregates[p.id] || { avgRating: 0, reviewCount: 0 };
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: Number(p.price),
        sku: p.sku,
        images: p.images,
        stockQuantity: p.stockQuantity,
        status: p.status,
        createdAt: p.createdAt,
        store: {
          id: p.storeId,
          name: row.storeName,
          slug: row.storeSlug,
        },
        category: p.categoryId
          ? {
              id: p.categoryId,
              name: row.categoryName,
            }
          : null,
        rating: stats.avgRating,
        reviewCount: stats.reviewCount,
      };
    });

    const response = {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };

    await this.redisService.setJson(
      cacheKey,
      response,
      BUYER_PRODUCT_CACHE_TTL,
    );
    return response;
  }

  async getProductDetails(productId: string) {
    const cacheKey = CacheKeys.buyerProduct(productId);
    const cached = await this.redisService.getJson<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const [row] = await this.db
      .select({
        product: products,
        categoryName: categories.name,
        storeName: stores.name,
        storeSlug: stores.slug,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(stores, eq(products.storeId, stores.id))
      .where(and(eq(products.id, productId), eq(products.status, 'ACTIVE')))
      .limit(1);

    if (!row) {
      throw new NotFoundException('Product not found or inactive');
    }

    const p = row.product;

    const [stats] = await this.db
      .select({
        avgRating: sql<number>`round(avg(${reviews.rating})::numeric, 1)::float`,
        reviewCount: sql<number>`count(${reviews.id})::int`,
      })
      .from(reviews)
      .where(eq(reviews.productId, productId));

    const recentReviews = await this.db
      .select()
      .from(reviews)
      .where(eq(reviews.productId, productId))
      .orderBy(desc(reviews.createdAt))
      .limit(5);

    const response = {
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: Number(p.price),
      sku: p.sku,
      images: p.images,
      stockQuantity: p.stockQuantity,
      status: p.status,
      createdAt: p.createdAt,
      store: {
        id: p.storeId,
        name: row.storeName,
        slug: row.storeSlug,
      },
      category: p.categoryId
        ? {
            id: p.categoryId,
            name: row.categoryName,
          }
        : null,
      rating: stats?.avgRating || 0,
      reviewCount: stats?.reviewCount || 0,
      recentReviews,
    };

    await this.redisService.setJson(
      cacheKey,
      response,
      BUYER_PRODUCT_CACHE_TTL,
    );
    return response;
  }
}
