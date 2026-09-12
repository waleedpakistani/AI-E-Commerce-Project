import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { eq, and, ne, ilike, lte, or, sql } from 'drizzle-orm';
import { DRIZZLE } from '../db/database.types';
import { products } from '../db/schema/products.schema';
import { stores } from '../db/schema/stores.schema';
import { categories } from '../db/schema/categories.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateStockDto, StockUpdateAction } from './dto/update-stock.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { RedisService } from '../common/redis/redis.service';
import { CacheKeys } from '../common/redis/cache.keys';
import { PRODUCT_CACHE_TTL } from '../common/redis/cache.constants';

@Injectable()
export class ProductsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: any,
    private readonly redisService: RedisService,
  ) {}

  private async invalidateProductCaches(
    storeId: string,
    productId?: string,
  ): Promise<void> {
    if (productId) {
      await this.redisService.delete(CacheKeys.product(productId));
      await this.redisService.delete(CacheKeys.buyerProduct(productId));
    }
    await this.redisService.deleteByPattern(
      CacheKeys.sellerProductsPattern(storeId),
    );
    await this.redisService.delete(CacheKeys.inventory(storeId));
    await this.redisService.delete(CacheKeys.lowStock(storeId));
    await this.redisService.deleteByPattern(CacheKeys.buyerProductsPattern());
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

  async validateCategory(storeId: string, categoryId: string) {
    const [category] = await this.db
      .select()
      .from(categories)
      .where(
        and(eq(categories.id, categoryId), eq(categories.storeId, storeId)),
      )
      .limit(1);

    if (!category) {
      throw new BadRequestException(
        'Category does not belong to this store or does not exist',
      );
    }

    return category;
  }

  private mapProductWithInventory(product: any, categoryName?: string | null) {
    const stockQuantity = Number(product.stockQuantity ?? 0);
    const lowStockThreshold = Number(product.lowStockThreshold ?? 5);

    return {
      ...product,
      price: Number(product.price),
      stockQuantity,
      lowStockThreshold,
      isLowStock: stockQuantity <= lowStockThreshold && stockQuantity > 0,
      isOutOfStock: stockQuantity === 0,
      category: product.categoryId
        ? {
            id: product.categoryId,
            name: categoryName || null,
          }
        : null,
    };
  }

  async createProduct(sellerId: string, storeId: string, dto: CreateProductDto) {
    await this.validateStoreOwnership(sellerId, storeId);

    let categoryName: string | null = null;
    if (dto.categoryId) {
      const category = await this.validateCategory(storeId, dto.categoryId);
      categoryName = category.name;
    }

    const slug = dto.slug ? this.slugify(dto.slug) : this.slugify(dto.name);

    const existingProduct = await this.db
      .select()
      .from(products)
      .where(and(eq(products.storeId, storeId), eq(products.slug, slug)))
      .limit(1);

    if (existingProduct.length > 0) {
      throw new ConflictException(
        'A product with this slug already exists in this store',
      );
    }

    const [newProduct] = await this.db
      .insert(products)
      .values({
        storeId,
        categoryId: dto.categoryId || null,
        name: dto.name,
        slug,
        description: dto.description || null,
        price: dto.price.toString(),
        sku: dto.sku || null,
        images: dto.images || [],
        status: dto.status || 'ACTIVE',
        stockQuantity: dto.stockQuantity ?? 0,
        lowStockThreshold: dto.lowStockThreshold ?? 5,
      })
      .returning();

    await this.invalidateProductCaches(storeId, newProduct.id);

    return this.mapProductWithInventory(newProduct, categoryName);
  }

  async getStoreProducts(
    sellerId: string,
    storeId: string,
    query?: QueryProductsDto,
  ) {
    await this.validateStoreOwnership(sellerId, storeId);

    const cacheKey = CacheKeys.sellerProducts(storeId, query);
    const cached = await this.redisService.getJson<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const conditions: any[] = [eq(products.storeId, storeId)];

    if (query?.categoryId) {
      conditions.push(eq(products.categoryId, query.categoryId));
    }

    if (query?.status) {
      conditions.push(eq(products.status, query.status));
    }

    if (query?.search) {
      conditions.push(
        or(
          ilike(products.name, `%${query.search}%`),
          ilike(products.description, `%${query.search}%`),
        ),
      );
    }

    if (query?.lowStock) {
      conditions.push(lte(products.stockQuantity, products.lowStockThreshold));
    }

    const whereClause = and(...conditions);

    let response: any;

    if (query?.page || query?.limit) {
      const page = query.page || 1;
      const limit = query.limit || 10;
      const offset = (page - 1) * limit;

      const [countResult] = await this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(products)
        .where(whereClause);

      const total = countResult?.count || 0;
      const totalPages = Math.ceil(total / limit) || 1;

      const result = await this.db
        .select({
          product: products,
          categoryName: categories.name,
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(whereClause)
        .limit(limit)
        .offset(offset);

      response = {
        items: result.map((row: any) => this.mapProductWithInventory(row.product, row.categoryName)),
        pagination: {
          total,
          page,
          limit,
          totalPages,
        },
      };
    } else {
      const result = await this.db
        .select({
          product: products,
          categoryName: categories.name,
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(whereClause);

      response = result.map((row: any) =>
        this.mapProductWithInventory(row.product, row.categoryName),
      );
    }

    await this.redisService.setJson(cacheKey, response, PRODUCT_CACHE_TTL);
    return response;
  }

  async getProductById(sellerId: string, productId: string) {
    const cacheKey = CacheKeys.product(productId);
    const cached = await this.redisService.getJson<any>(cacheKey);
    if (cached) {
      await this.validateStoreOwnership(sellerId, cached.storeId);
      return cached;
    }

    const [row] = await this.db
      .select({
        product: products,
        categoryName: categories.name,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.id, productId))
      .limit(1);

    if (!row) {
      throw new NotFoundException('Product not found');
    }

    await this.validateStoreOwnership(sellerId, row.product.storeId);

    const mapped = this.mapProductWithInventory(row.product, row.categoryName);
    await this.redisService.setJson(cacheKey, mapped, PRODUCT_CACHE_TTL);
    return mapped;
  }

  async updateProduct(
    sellerId: string,
    productId: string,
    dto: UpdateProductDto,
  ) {
    const existingProduct = await this.getProductById(sellerId, productId);

    if (dto.categoryId) {
      await this.validateCategory(existingProduct.storeId, dto.categoryId);
    }

    const updateData: Partial<typeof products.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (dto.categoryId !== undefined) {
      updateData.categoryId = dto.categoryId || null;
    }

    if (dto.name) {
      updateData.name = dto.name;
    }

    if (dto.description !== undefined) {
      updateData.description = dto.description;
    }

    if (dto.price !== undefined) {
      updateData.price = dto.price.toString();
    }

    if (dto.sku !== undefined) {
      updateData.sku = dto.sku;
    }

    if (dto.images !== undefined) {
      updateData.images = dto.images;
    }

    if (dto.status !== undefined) {
      updateData.status = dto.status;
    }

    if (dto.stockQuantity !== undefined) {
      updateData.stockQuantity = dto.stockQuantity;
    }

    if (dto.lowStockThreshold !== undefined) {
      updateData.lowStockThreshold = dto.lowStockThreshold;
    }

    if (dto.slug || dto.name) {
      const newSlug = dto.slug
        ? this.slugify(dto.slug)
        : dto.name
          ? this.slugify(dto.name)
          : existingProduct.slug;

      if (newSlug !== existingProduct.slug) {
        const slugConflicts = await this.db
          .select()
          .from(products)
          .where(
            and(
              eq(products.storeId, existingProduct.storeId),
              eq(products.slug, newSlug),
              ne(products.id, productId),
            ),
          )
          .limit(1);

        if (slugConflicts.length > 0) {
          throw new ConflictException(
            'A product with this slug already exists in this store',
          );
        }

        updateData.slug = newSlug;
      }
    }

    await this.db
      .update(products)
      .set(updateData)
      .where(eq(products.id, productId));

    await this.invalidateProductCaches(existingProduct.storeId, productId);

    return this.getProductById(sellerId, productId);
  }

  async deleteProduct(sellerId: string, productId: string) {
    const existingProduct = await this.getProductById(sellerId, productId);

    await this.db.delete(products).where(eq(products.id, productId));

    await this.invalidateProductCaches(existingProduct.storeId, productId);

    return { message: 'Product deleted successfully' };
  }

  // Inventory Management Methods
  async updateProductStock(
    sellerId: string,
    productId: string,
    dto: UpdateStockDto,
  ) {
    const existingProduct = await this.getProductById(sellerId, productId);

    let newStock = existingProduct.stockQuantity;
    const action = dto.action || StockUpdateAction.SET;

    if (action === StockUpdateAction.SET) {
      newStock = dto.quantity;
    } else if (action === StockUpdateAction.ADD) {
      newStock += dto.quantity;
    } else if (action === StockUpdateAction.SUBTRACT) {
      newStock -= dto.quantity;
    }

    if (newStock < 0) {
      throw new BadRequestException('Stock quantity cannot be negative');
    }

    const updateData: Partial<typeof products.$inferInsert> = {
      stockQuantity: newStock,
      updatedAt: new Date(),
    };

    if (dto.lowStockThreshold !== undefined) {
      updateData.lowStockThreshold = dto.lowStockThreshold;
    }

    const [updatedProduct] = await this.db
      .update(products)
      .set(updateData)
      .where(eq(products.id, productId))
      .returning();

    await this.invalidateProductCaches(existingProduct.storeId, productId);

    return this.mapProductWithInventory(updatedProduct);
  }

  async getStoreInventory(sellerId: string, storeId: string) {
    await this.validateStoreOwnership(sellerId, storeId);

    const cacheKey = CacheKeys.inventory(storeId);
    const cached = await this.redisService.getJson<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const storeProducts = await this.db
      .select()
      .from(products)
      .where(eq(products.storeId, storeId));

    const mappedProducts = storeProducts.map((p: any) =>
      this.mapProductWithInventory(p),
    );

    const totalStock = mappedProducts.reduce(
      (acc: number, item: any) => acc + item.stockQuantity,
      0,
    );

    const lowStockItems = mappedProducts.filter((item: any) => item.isLowStock);
    const outOfStockItems = mappedProducts.filter(
      (item: any) => item.isOutOfStock,
    );

    const response = {
      storeId,
      totalProducts: mappedProducts.length,
      totalStock,
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStockItems.length,
      items: mappedProducts,
    };

    await this.redisService.setJson(cacheKey, response, PRODUCT_CACHE_TTL);
    return response;
  }

  async getStoreLowStock(sellerId: string, storeId: string) {
    await this.validateStoreOwnership(sellerId, storeId);

    const cacheKey = CacheKeys.lowStock(storeId);
    const cached = await this.redisService.getJson<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const storeProducts = await this.db
      .select()
      .from(products)
      .where(eq(products.storeId, storeId));

    const mappedProducts = storeProducts.map((p: any) =>
      this.mapProductWithInventory(p),
    );

    const response = mappedProducts.filter(
      (item: any) => item.isLowStock || item.isOutOfStock,
    );

    await this.redisService.setJson(cacheKey, response, PRODUCT_CACHE_TTL);
    return response;
  }
}
