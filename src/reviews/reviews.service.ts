import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { eq, and, desc, sql } from 'drizzle-orm';
import { DRIZZLE } from '../db/database.types';
import { reviews } from '../db/schema/reviews.schema';
import { orders, orderItems } from '../db/schema/orders.schema';
import { products } from '../db/schema/products.schema';
import { buyers } from '../db/schema/buyers.schema';
import { CreateReviewDto } from './dto/create-review.dto';
import { QueryReviewsDto } from './dto/query-reviews.dto';
import { RedisService } from '../common/redis/redis.service';
import { CacheKeys } from '../common/redis/cache.keys';

@Injectable()
export class ReviewsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: any,
    private readonly redisService: RedisService,
  ) {}

  async createReview(buyerId: string, dto: CreateReviewDto) {
    // 1. Verify buyer owns the order
    const [ord] = await this.db
      .select()
      .from(orders)
      .where(and(eq(orders.id, dto.orderId), eq(orders.buyerId, buyerId)))
      .limit(1);

    if (!ord) {
      throw new NotFoundException('Order not found for this buyer');
    }

    // 2. Verify product is in orderItems of this order
    const [item] = await this.db
      .select()
      .from(orderItems)
      .where(
        and(
          eq(orderItems.orderId, dto.orderId),
          eq(orderItems.productId, dto.productId),
        ),
      )
      .limit(1);

    if (!item) {
      throw new BadRequestException(
        'You can only review products that were purchased in this order',
      );
    }

    // 3. Check for existing review
    const [existing] = await this.db
      .select()
      .from(reviews)
      .where(
        and(
          eq(reviews.buyerId, buyerId),
          eq(reviews.productId, dto.productId),
          eq(reviews.orderId, dto.orderId),
        ),
      )
      .limit(1);

    if (existing) {
      throw new ConflictException(
        'You have already reviewed this product for this order',
      );
    }

    // 4. Create review
    const [newReview] = await this.db
      .insert(reviews)
      .values({
        buyerId,
        productId: dto.productId,
        orderId: dto.orderId,
        rating: dto.rating,
        comment: dto.comment,
      })
      .returning();

    await this.redisService.delete(CacheKeys.buyerProduct(dto.productId));
    await this.redisService.deleteByPattern(CacheKeys.buyerProductsPattern());

    return newReview;
  }

  async getMyReviews(buyerId: string, query: QueryReviewsDto) {
    const { page = 1, limit = 10 } = query;
    const offset = (page - 1) * limit;

    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(reviews)
      .where(eq(reviews.buyerId, buyerId));

    const total = countResult?.count || 0;
    const totalPages = Math.ceil(total / limit) || 1;

    const items = await this.db
      .select({
        review: reviews,
        productName: products.name,
        productSlug: products.slug,
        productImage: sql<string>`${products.images}->>0`,
      })
      .from(reviews)
      .leftJoin(products, eq(reviews.productId, products.id))
      .where(eq(reviews.buyerId, buyerId))
      .orderBy(desc(reviews.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      items: items.map((row: any) => ({
        id: row.review.id,
        productId: row.review.productId,
        productName: row.productName,
        productSlug: row.productSlug,
        productImage: row.productImage || null,
        orderId: row.review.orderId,
        rating: row.review.rating,
        comment: row.review.comment,
        createdAt: row.review.createdAt,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async getProductReviews(productId: string, query: QueryReviewsDto) {
    const { page = 1, limit = 10 } = query;
    const offset = (page - 1) * limit;

    const [stats] = await this.db
      .select({
        avgRating: sql<number>`round(avg(${reviews.rating})::numeric, 1)::float`,
        reviewCount: sql<number>`count(${reviews.id})::int`,
      })
      .from(reviews)
      .where(eq(reviews.productId, productId));

    const total = stats?.reviewCount || 0;
    const totalPages = Math.ceil(total / limit) || 1;

    const items = await this.db
      .select({
        review: reviews,
        buyerName: buyers.name,
      })
      .from(reviews)
      .leftJoin(buyers, eq(reviews.buyerId, buyers.id))
      .where(eq(reviews.productId, productId))
      .orderBy(desc(reviews.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      productId,
      avgRating: stats?.avgRating || 0,
      reviewCount: total,
      items: items.map((row: any) => ({
        id: row.review.id,
        buyerName: row.buyerName || 'Verified Buyer',
        rating: row.review.rating,
        comment: row.review.comment,
        createdAt: row.review.createdAt,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async deleteReview(buyerId: string, reviewId: string) {
    const [existing] = await this.db
      .select()
      .from(reviews)
      .where(and(eq(reviews.id, reviewId), eq(reviews.buyerId, buyerId)))
      .limit(1);

    if (!existing) {
      throw new NotFoundException('Review not found or unauthorized');
    }

    await this.db
      .delete(reviews)
      .where(and(eq(reviews.id, reviewId), eq(reviews.buyerId, buyerId)));

    await this.redisService.delete(
      CacheKeys.buyerProduct(existing.productId),
    );
    await this.redisService.deleteByPattern(CacheKeys.buyerProductsPattern());

    return { message: 'Review deleted successfully' };
  }
}
