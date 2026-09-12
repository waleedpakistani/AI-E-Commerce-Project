import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { eq, and, ne } from 'drizzle-orm';
import { DRIZZLE } from '../db/database.types';
import { stores } from '../db/schema/stores.schema';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { RedisService } from '../common/redis/redis.service';
import { CacheKeys } from '../common/redis/cache.keys';
import { STORE_CACHE_TTL } from '../common/redis/cache.constants';

@Injectable()
export class StoresService {
  constructor(
    @Inject(DRIZZLE) private readonly db: any,
    private readonly redisService: RedisService,
  ) {}

  private async invalidateStoreCaches(
    sellerId: string,
    storeId: string,
  ): Promise<void> {
    await this.redisService.delete(CacheKeys.store(storeId));
    await this.redisService.delete(CacheKeys.sellerStoreList(sellerId));
    await this.redisService.deleteByPattern(
      CacheKeys.buyerProductsPattern(),
    );
    await this.redisService.deleteByPattern(CacheKeys.cartPattern());
  }

  private slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }

  async createStore(sellerId: string, dto: CreateStoreDto) {
    const slug = dto.slug ? this.slugify(dto.slug) : this.slugify(dto.name);

    const existingStores = await this.db
      .select()
      .from(stores)
      .where(eq(stores.slug, slug))
      .limit(1);

    if (existingStores.length > 0) {
      throw new ConflictException('A store with this slug already exists');
    }

    const [newStore] = await this.db
      .insert(stores)
      .values({
        sellerId,
        name: dto.name,
        slug,
        description: dto.description || null,
        logoUrl: dto.logoUrl || null,
        status: 'ACTIVE',
      })
      .returning();

    await this.redisService.delete(CacheKeys.sellerStoreList(sellerId));

    return newStore;
  }

  async getSellerStores(sellerId: string) {
    const cacheKey = CacheKeys.sellerStoreList(sellerId);
    const cached = await this.redisService.getJson<any[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await this.db
      .select()
      .from(stores)
      .where(eq(stores.sellerId, sellerId));

    await this.redisService.setJson(cacheKey, result, STORE_CACHE_TTL);
    return result;
  }

  async getSellerStoreById(sellerId: string, storeId: string) {
    const cacheKey = CacheKeys.store(storeId);
    const cached = await this.redisService.getJson<any>(cacheKey);
    if (cached && cached.sellerId === sellerId) {
      return cached;
    }

    const [store] = await this.db
      .select()
      .from(stores)
      .where(and(eq(stores.id, storeId), eq(stores.sellerId, sellerId)))
      .limit(1);

    if (!store) {
      throw new NotFoundException('Store not found or unauthorized');
    }

    await this.redisService.setJson(cacheKey, store, STORE_CACHE_TTL);
    return store;
  }

  async updateStore(sellerId: string, storeId: string, dto: UpdateStoreDto) {
    const existingStore = await this.getSellerStoreById(sellerId, storeId);

    const updateData: Partial<typeof stores.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (dto.name) {
      updateData.name = dto.name;
    }

    if (dto.description !== undefined) {
      updateData.description = dto.description;
    }

    if (dto.logoUrl !== undefined) {
      updateData.logoUrl = dto.logoUrl;
    }

    if (dto.status) {
      updateData.status = dto.status;
    }

    if (dto.slug || dto.name) {
      const newSlug = dto.slug
        ? this.slugify(dto.slug)
        : dto.name
          ? this.slugify(dto.name)
          : existingStore.slug;

      if (newSlug !== existingStore.slug) {
        const slugConflicts = await this.db
          .select()
          .from(stores)
          .where(and(eq(stores.slug, newSlug), ne(stores.id, storeId)))
          .limit(1);

        if (slugConflicts.length > 0) {
          throw new ConflictException('A store with this slug already exists');
        }

        updateData.slug = newSlug;
      }
    }

    const [updatedStore] = await this.db
      .update(stores)
      .set(updateData)
      .where(and(eq(stores.id, storeId), eq(stores.sellerId, sellerId)))
      .returning();

    await this.invalidateStoreCaches(sellerId, storeId);

    return updatedStore;
  }

  async deleteStore(sellerId: string, storeId: string) {
    await this.getSellerStoreById(sellerId, storeId);

    await this.db
      .delete(stores)
      .where(and(eq(stores.id, storeId), eq(stores.sellerId, sellerId)));

    await this.invalidateStoreCaches(sellerId, storeId);
    await this.redisService.delete(CacheKeys.categoriesByStore(storeId));
    await this.redisService.deleteByPattern(
      CacheKeys.sellerProductsPattern(storeId),
    );
    await this.redisService.delete(CacheKeys.inventory(storeId));
    await this.redisService.delete(CacheKeys.lowStock(storeId));

    return { message: 'Store deleted successfully' };
  }
}
