import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { eq, and, ne } from 'drizzle-orm';
import { DRIZZLE } from '../db/database.types';
import { categories } from '../db/schema/categories.schema';
import { stores } from '../db/schema/stores.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { RedisService } from '../common/redis/redis.service';
import { CacheKeys } from '../common/redis/cache.keys';
import { CATEGORY_CACHE_TTL } from '../common/redis/cache.constants';

@Injectable()
export class CategoriesService {
  constructor(
    @Inject(DRIZZLE) private readonly db: any,
    private readonly redisService: RedisService,
  ) {}

  private async invalidateCategoryCaches(
    storeId: string,
    categoryId: string,
  ): Promise<void> {
    await this.redisService.delete(CacheKeys.category(categoryId));
    await this.redisService.delete(CacheKeys.categoriesByStore(storeId));
    await this.redisService.deleteByPattern(
      CacheKeys.sellerProductsPattern(storeId),
    );
    await this.redisService.deleteByPattern(CacheKeys.productPattern());
    await this.redisService.deleteByPattern(CacheKeys.buyerProductPattern());
    await this.redisService.deleteByPattern(CacheKeys.buyerProductsPattern());
    await this.redisService.delete(CacheKeys.inventory(storeId));
    await this.redisService.delete(CacheKeys.lowStock(storeId));
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

  async validateStoreOwnership(sellerId: string, storeId: string) {
    const [store] = await this.db
      .select()
      .from(stores)
      .where(and(eq(stores.id, storeId), eq(stores.sellerId, sellerId)))
      .limit(1);

    if (!store) {
      throw new NotFoundException('Store not found or unauthorized');
    }

    return store;
  }

  async createCategory(
    sellerId: string,
    storeId: string,
    dto: CreateCategoryDto,
  ) {
    await this.validateStoreOwnership(sellerId, storeId);

    const slug = dto.slug ? this.slugify(dto.slug) : this.slugify(dto.name);

    const existingCategory = await this.db
      .select()
      .from(categories)
      .where(
        and(eq(categories.storeId, storeId), eq(categories.slug, slug)),
      )
      .limit(1);

    if (existingCategory.length > 0) {
      throw new ConflictException(
        'A category with this slug already exists in this store',
      );
    }

    const [newCategory] = await this.db
      .insert(categories)
      .values({
        storeId,
        name: dto.name,
        slug,
        description: dto.description || null,
      })
      .returning();

    await this.redisService.delete(CacheKeys.categoriesByStore(storeId));
    await this.redisService.deleteByPattern(CacheKeys.buyerProductsPattern());

    return newCategory;
  }

  async getStoreCategories(sellerId: string, storeId: string) {
    await this.validateStoreOwnership(sellerId, storeId);

    const cacheKey = CacheKeys.categoriesByStore(storeId);
    const cached = await this.redisService.getJson<any[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await this.db
      .select()
      .from(categories)
      .where(eq(categories.storeId, storeId));

    await this.redisService.setJson(cacheKey, result, CATEGORY_CACHE_TTL);
    return result;
  }

  async getCategoryById(sellerId: string, categoryId: string) {
    const cacheKey = CacheKeys.category(categoryId);
    const cached = await this.redisService.getJson<any>(cacheKey);
    if (cached) {
      await this.validateStoreOwnership(sellerId, cached.storeId);
      return cached;
    }

    const [category] = await this.db
      .select()
      .from(categories)
      .where(eq(categories.id, categoryId))
      .limit(1);

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    await this.validateStoreOwnership(sellerId, category.storeId);

    await this.redisService.setJson(cacheKey, category, CATEGORY_CACHE_TTL);
    return category;
  }

  async updateCategory(
    sellerId: string,
    categoryId: string,
    dto: UpdateCategoryDto,
  ) {
    const existingCategory = await this.getCategoryById(sellerId, categoryId);

    const updateData: Partial<typeof categories.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (dto.name) {
      updateData.name = dto.name;
    }

    if (dto.description !== undefined) {
      updateData.description = dto.description;
    }

    if (dto.slug || dto.name) {
      const newSlug = dto.slug
        ? this.slugify(dto.slug)
        : dto.name
          ? this.slugify(dto.name)
          : existingCategory.slug;

      if (newSlug !== existingCategory.slug) {
        const slugConflicts = await this.db
          .select()
          .from(categories)
          .where(
            and(
              eq(categories.storeId, existingCategory.storeId),
              eq(categories.slug, newSlug),
              ne(categories.id, categoryId),
            ),
          )
          .limit(1);

        if (slugConflicts.length > 0) {
          throw new ConflictException(
            'A category with this slug already exists in this store',
          );
        }

        updateData.slug = newSlug;
      }
    }

    const [updatedCategory] = await this.db
      .update(categories)
      .set(updateData)
      .where(eq(categories.id, categoryId))
      .returning();

    await this.invalidateCategoryCaches(
      existingCategory.storeId,
      categoryId,
    );

    return updatedCategory;
  }

  async deleteCategory(sellerId: string, categoryId: string) {
    const existingCategory = await this.getCategoryById(sellerId, categoryId);

    await this.db.delete(categories).where(eq(categories.id, categoryId));

    await this.invalidateCategoryCaches(
      existingCategory.storeId,
      categoryId,
    );

    return { message: 'Category deleted successfully' };
  }
}
