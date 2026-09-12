import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { DRIZZLE } from '../db/database.types';
import { stores } from '../db/schema/stores.schema';
import { products } from '../db/schema/products.schema';
import { categories } from '../db/schema/categories.schema';
import { orders } from '../db/schema/orders.schema';

@Injectable()
export class DashboardService {
  constructor(@Inject(DRIZZLE) private readonly db: any) { }

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

  async getStoreDashboardStats(sellerId: string, storeId: string) {
    await this.validateStoreOwnership(sellerId, storeId);

    const storeProducts = await this.db
      .select()
      .from(products)
      .where(eq(products.storeId, storeId));

    const totalProducts = storeProducts.length;
    let activeProducts = 0;
    let draftProducts = 0;
    let archivedProducts = 0;
    let totalStock = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    const lowStockAlertItems: any[] = [];

    for (const prod of storeProducts) {
      if (prod.status === 'ACTIVE') activeProducts++;
      else if (prod.status === 'DRAFT') draftProducts++;
      else if (prod.status === 'ARCHIVED') archivedProducts++;

      const qty = Number(prod.stockQuantity ?? 0);
      const threshold = Number(prod.lowStockThreshold ?? 5);

      totalStock += qty;

      if (qty === 0) {
        outOfStockCount++;
        lowStockAlertItems.push({
          id: prod.id,
          name: prod.name,
          sku: prod.sku,
          stockQuantity: qty,
          lowStockThreshold: threshold,
          status: 'OUT_OF_STOCK',
        });
      } else if (qty <= threshold) {
        lowStockCount++;
        lowStockAlertItems.push({
          id: prod.id,
          name: prod.name,
          sku: prod.sku,
          stockQuantity: qty,
          lowStockThreshold: threshold,
          status: 'LOW_STOCK',
        });
      }
    }

    const storeCategories = await this.db
      .select()
      .from(categories)
      .where(eq(categories.storeId, storeId));

    const totalCategories = storeCategories.length;

    const storeOrders = await this.db
      .select()
      .from(orders)
      .where(eq(orders.storeId, storeId))
      .orderBy(desc(orders.createdAt));

    const totalOrders = storeOrders.length;
    const totalRevenue = storeOrders.reduce(
      (sum: number, ord: any) => sum + Number(ord.totalAmount ?? 0),
      0,
    );
    const pendingOrders = storeOrders.filter(
      (ord: any) => ord.status === 'PENDING',
    ).length;

    const recentOrders = storeOrders.slice(0, 5).map((ord: any) => ({
      id: ord.id,
      orderNumber: ord.orderNumber,
      customerName: ord.customerName,
      customerEmail: ord.customerEmail,
      totalAmount: Number(ord.totalAmount),
      status: ord.status,
      createdAt: ord.createdAt,
    }));

    return {
      storeId,
      products: {
        total: totalProducts,
        active: activeProducts,
        draft: draftProducts,
        archived: archivedProducts,
      },
      inventory: {
        totalStock,
        lowStockCount,
        outOfStockCount,
        alerts: lowStockAlertItems.slice(0, 10),
      },
      categories: {
        total: totalCategories,
      },
      sales: {
        totalOrders,
        totalRevenue,
        pendingOrders,
        recentOrders,
      },
    };
  }

  async getOverallSellerDashboard(sellerId: string) {
    const sellerStores = await this.db
      .select()
      .from(stores)
      .where(eq(stores.sellerId, sellerId));

    const storeSummaries = await Promise.all(
      sellerStores.map(async (store: any) => {
        const stats = await this.getStoreDashboardStats(sellerId, store.id);
        return {
          storeId: store.id,
          storeName: store.name,
          storeSlug: store.slug,
          status: store.status,
          stats,
        };
      }),
    );

    const overallTotalProducts = storeSummaries.reduce(
      (sum, s) => sum + s.stats.products.total,
      0,
    );
    const overallTotalRevenue = storeSummaries.reduce(
      (sum, s) => sum + s.stats.sales.totalRevenue,
      0,
    );
    const overallTotalOrders = storeSummaries.reduce(
      (sum, s) => sum + s.stats.sales.totalOrders,
      0,
    );

    return {
      sellerId,
      totalStores: sellerStores.length,
      overallMetrics: {
        totalProducts: overallTotalProducts,
        totalOrders: overallTotalOrders,
        totalRevenue: overallTotalRevenue,
      },
      stores: storeSummaries,
    };
  }
}
