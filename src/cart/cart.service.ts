import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { eq, and, desc, or } from 'drizzle-orm';
import { DRIZZLE } from '../db/database.types';
import { cartItems } from '../db/schema/carts.schema';
import { products } from '../db/schema/products.schema';
import { stores } from '../db/schema/stores.schema';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { RedisService } from '../common/redis/redis.service';
import { CacheKeys } from '../common/redis/cache.keys';
import { CART_CACHE_TTL } from '../common/redis/cache.constants';

@Injectable()
export class CartService {
  constructor(
    @Inject(DRIZZLE) private readonly db: any,
    private readonly redisService: RedisService,
  ) {}

  private async invalidateCartCache(buyerId: string): Promise<void> {
    await this.redisService.delete(CacheKeys.cart(buyerId));
  }

  async getCart(buyerId: string) {
    const cacheKey = CacheKeys.cart(buyerId);
    const cached = await this.redisService.getJson<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const rawItems = await this.db
      .select({
        cartItemId: cartItems.id,
        quantity: cartItems.quantity,
        addedAt: cartItems.createdAt,
        updatedAt: cartItems.updatedAt,
        product: products,
        storeName: stores.name,
        storeSlug: stores.slug,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .leftJoin(stores, eq(products.storeId, stores.id))
      .where(eq(cartItems.buyerId, buyerId))
      .orderBy(desc(cartItems.createdAt));

    let grandTotal = 0;
    const items = rawItems.map((row: any) => {
      const p = row.product;
      const unitPrice = Number(p.price);
      const subtotal = Number((unitPrice * row.quantity).toFixed(2));
      grandTotal += subtotal;

      const isAvailable = p.status === 'ACTIVE' && p.stockQuantity >= row.quantity;

      return {
        id: row.cartItemId,
        cartItemId: row.cartItemId,
        productId: p.id,
        quantity: row.quantity,
        price: unitPrice,
        unitPrice,
        subtotal,
        isAvailable,
        stockQuantity: p.stockQuantity,
        addedAt: row.addedAt,
        product: {
          id: p.id,
          name: p.name,
          slug: p.slug,
          images: p.images,
          status: p.status,
          storeId: p.storeId,
          storeName: row.storeName,
          storeSlug: row.storeSlug,
        },
      };
    });

    const response = {
      items,
      grandTotal: Number(grandTotal.toFixed(2)),
      totalAmount: Number(grandTotal.toFixed(2)),
      itemCount: items.length,
    };

    await this.redisService.setJson(cacheKey, response, CART_CACHE_TTL);
    return response;
  }

  async addItem(buyerId: string, dto: AddCartItemDto) {
    const [product] = await this.db
      .select()
      .from(products)
      .where(eq(products.id, dto.productId))
      .limit(1);

    if (!product || product.status !== 'ACTIVE') {
      throw new NotFoundException('Product not found or unavailable');
    }

    const [existing] = await this.db
      .select()
      .from(cartItems)
      .where(
        and(eq(cartItems.buyerId, buyerId), eq(cartItems.productId, dto.productId)),
      )
      .limit(1);

    const newQuantity = (existing ? existing.quantity : 0) + dto.quantity;

    if (product.stockQuantity < newQuantity) {
      throw new BadRequestException(
        `Insufficient stock for ${product.name}. Available: ${product.stockQuantity}, requested: ${newQuantity}`,
      );
    }

    if (existing) {
      await this.db
        .update(cartItems)
        .set({
          quantity: newQuantity,
          updatedAt: new Date(),
        })
        .where(eq(cartItems.id, existing.id));
    } else {
      await this.db
        .insert(cartItems)
        .values({
          buyerId,
          productId: dto.productId,
          quantity: dto.quantity,
        });
    }

    await this.invalidateCartCache(buyerId);

    return this.getCart(buyerId);
  }

  async updateItemQuantity(
    buyerId: string,
    identifier: string,
    dto: UpdateCartItemDto,
  ) {
    const [existing] = await this.db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.buyerId, buyerId),
          or(eq(cartItems.productId, identifier), eq(cartItems.id, identifier)),
        ),
      )
      .limit(1);

    if (!existing) {
      throw new NotFoundException('Cart item not found');
    }

    const [product] = await this.db
      .select()
      .from(products)
      .where(eq(products.id, existing.productId))
      .limit(1);

    if (!product || product.status !== 'ACTIVE') {
      throw new NotFoundException('Product not found or unavailable');
    }

    if (product.stockQuantity < dto.quantity) {
      throw new BadRequestException(
        `Insufficient stock for ${product.name}. Available: ${product.stockQuantity}`,
      );
    }

    await this.db
      .update(cartItems)
      .set({
        quantity: dto.quantity,
        updatedAt: new Date(),
      })
      .where(eq(cartItems.id, existing.id));

    await this.invalidateCartCache(buyerId);

    return this.getCart(buyerId);
  }

  async removeItem(buyerId: string, identifier: string) {
    const deleted = await this.db
      .delete(cartItems)
      .where(
        and(
          eq(cartItems.buyerId, buyerId),
          or(eq(cartItems.productId, identifier), eq(cartItems.id, identifier)),
        ),
      )
      .returning();

    if (deleted.length === 0) {
      throw new NotFoundException('Cart item not found');
    }

    await this.invalidateCartCache(buyerId);

    return this.getCart(buyerId);
  }

  async clearCart(buyerId: string) {
    await this.db.delete(cartItems).where(eq(cartItems.buyerId, buyerId));
    await this.invalidateCartCache(buyerId);
    return { message: 'Cart cleared successfully' };
  }
}
