import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { eq, and, desc, sql, ilike, or } from 'drizzle-orm';
import { DRIZZLE } from '../db/database.types';
import { orders, orderItems } from '../db/schema/orders.schema';
import { stores } from '../db/schema/stores.schema';
import { products } from '../db/schema/products.schema';
import { buyers } from '../db/schema/buyers.schema';
import { QuerySellerOrdersDto } from './dto/query-seller-orders.dto';
import {
  UpdateOrderStatusDto,
  OrderStatusEnum,
} from './dto/update-order-status.dto';
import { RedisService } from '../common/redis/redis.service';
import { CacheKeys } from '../common/redis/cache.keys';

@Injectable()
export class SellerOrdersService {
  constructor(
    @Inject(DRIZZLE) private readonly db: any,
    private readonly redisService: RedisService,
  ) {}

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

  async getStoreOrders(
    sellerId: string,
    storeId: string,
    query: QuerySellerOrdersDto,
  ) {
    await this.validateStoreOwnership(sellerId, storeId);

    const { status, paymentStatus, search, page = 1, limit = 10 } = query;
    const conditions = [eq(orders.storeId, storeId)];

    if (status) {
      conditions.push(eq(orders.status, status));
    }

    if (paymentStatus) {
      conditions.push(eq(orders.paymentStatus, paymentStatus.toUpperCase()));
    }

    if (search) {
      const searchFilter = or(
        ilike(orders.orderNumber, `%${search}%`),
        ilike(orders.customerName, `%${search}%`),
        ilike(orders.customerEmail, `%${search}%`),
      )!;
      conditions.push(searchFilter);
    }

    const whereClause = and(...conditions);

    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(whereClause);

    const total = countResult?.count || 0;
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;

    const rawOrders = await this.db
      .select({
        order: orders,
        buyer: {
          id: buyers.id,
          name: buyers.name,
          email: buyers.email,
        },
      })
      .from(orders)
      .leftJoin(buyers, eq(orders.buyerId, buyers.id))
      .where(whereClause)
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    const items = await Promise.all(
      rawOrders.map(async (row: any) => {
        const ord = row.order;
        const itemsList = await this.db
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, ord.id));

        return {
          id: ord.id,
          orderNumber: ord.orderNumber,
          buyer: row.buyer?.id
            ? row.buyer
            : {
                id: ord.buyerId || null,
                name: ord.customerName,
                email: ord.customerEmail,
              },
          customerName: ord.customerName,
          customerEmail: ord.customerEmail,
          shippingAddress: ord.shippingAddress,
          totalAmount: Number(ord.totalAmount),
          status: ord.status,
          paymentMethod: ord.paymentMethod,
          paymentStatus: ord.paymentStatus,
          createdAt: ord.createdAt,
          updatedAt: ord.updatedAt,
          itemsCount: itemsList.length,
          items: itemsList.map((i: any) => ({
            id: i.id,
            productId: i.productId,
            productName: i.productName,
            quantity: i.quantity,
            unitPrice: Number(i.unitPrice),
            totalPrice: Number(i.totalPrice),
          })),
        };
      }),
    );

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async getOrderDetails(sellerId: string, storeId: string, orderId: string) {
    await this.validateStoreOwnership(sellerId, storeId);

    const [row] = await this.db
      .select({
        order: orders,
        buyer: {
          id: buyers.id,
          name: buyers.name,
          email: buyers.email,
          phone: buyers.phone,
        },
      })
      .from(orders)
      .leftJoin(buyers, eq(orders.buyerId, buyers.id))
      .where(and(eq(orders.id, orderId), eq(orders.storeId, storeId)))
      .limit(1);

    if (!row) {
      throw new NotFoundException('Order not found in this store');
    }

    const ord = row.order;

    const itemsList = await this.db
      .select({
        item: orderItems,
        productImage: sql<string>`${products.images}->>0`,
        currentStock: products.stockQuantity,
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, ord.id));

    return {
      id: ord.id,
      storeId: ord.storeId,
      orderNumber: ord.orderNumber,
      buyer: row.buyer?.id
        ? row.buyer
        : {
            id: ord.buyerId || null,
            name: ord.customerName,
            email: ord.customerEmail,
          },
      customerName: ord.customerName,
      customerEmail: ord.customerEmail,
      shippingAddress: ord.shippingAddress,
      paymentMethod: ord.paymentMethod,
      paymentStatus: ord.paymentStatus,
      status: ord.status,
      notes: ord.notes,
      totalAmount: Number(ord.totalAmount),
      createdAt: ord.createdAt,
      updatedAt: ord.updatedAt,
      items: itemsList.map((rowItem: any) => ({
        id: rowItem.item.id,
        productId: rowItem.item.productId,
        productName: rowItem.item.productName,
        quantity: rowItem.item.quantity,
        unitPrice: Number(rowItem.item.unitPrice),
        totalPrice: Number(rowItem.item.totalPrice),
        productImage: rowItem.productImage || null,
        currentStock: rowItem.currentStock ?? null,
      })),
    };
  }

  async updateOrderStatus(
    sellerId: string,
    storeId: string,
    orderId: string,
    dto: UpdateOrderStatusDto,
  ) {
    await this.validateStoreOwnership(sellerId, storeId);

    const result = await this.db.transaction(async (tx: any) => {
      const [ord] = await tx
        .select()
        .from(orders)
        .where(and(eq(orders.id, orderId), eq(orders.storeId, storeId)))
        .limit(1);

      if (!ord) {
        throw new NotFoundException('Order not found in this store');
      }

      const previousStatus = ord.status;
      const newStatus = dto.status;

      if (previousStatus === 'CANCELLED' && newStatus !== 'CANCELLED') {
        throw new BadRequestException(
          'Cannot change status of a CANCELLED order',
        );
      }

      const cancelledProductIds: string[] = [];

      // If updating to CANCELLED and was not previously CANCELLED, restore product stock
      if (newStatus === OrderStatusEnum.CANCELLED && previousStatus !== OrderStatusEnum.CANCELLED) {
        const itemsList = await tx
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, orderId));

        for (const item of itemsList) {
          if (item.productId) {
            cancelledProductIds.push(item.productId);
            await tx
              .update(products)
              .set({
                stockQuantity: sql`${products.stockQuantity} + ${item.quantity}`,
                updatedAt: new Date(),
              })
              .where(eq(products.id, item.productId));
          }
        }
      }

      const updateData: Partial<typeof orders.$inferInsert> = {
        status: newStatus,
        updatedAt: new Date(),
      };

      if (dto.paymentStatus) {
        updateData.paymentStatus = dto.paymentStatus.toUpperCase();
      } else if (newStatus === OrderStatusEnum.DELIVERED && ord.paymentMethod === 'COD') {
        updateData.paymentStatus = 'PAID';
      }

      if (dto.notes !== undefined) {
        updateData.notes = dto.notes;
      }

      const [updatedOrder] = await tx
        .update(orders)
        .set(updateData)
        .where(eq(orders.id, orderId))
        .returning();

      return {
        message: `Order status updated to ${newStatus}`,
        order: {
          id: updatedOrder.id,
          orderNumber: updatedOrder.orderNumber,
          status: updatedOrder.status,
          paymentStatus: updatedOrder.paymentStatus,
          notes: updatedOrder.notes,
          updatedAt: updatedOrder.updatedAt,
        },
        cancelledProductIds,
      };
    });

    // Invalidate caches if stock was restored (cancelled)
    if (result.cancelledProductIds.length > 0) {
      await this.redisService.deleteByPattern(CacheKeys.buyerProductsPattern());
      await this.redisService.deleteByPattern(CacheKeys.cartPattern());
      for (const pid of result.cancelledProductIds) {
        await this.redisService.delete(CacheKeys.product(pid));
        await this.redisService.delete(CacheKeys.buyerProduct(pid));
      }
      await this.redisService.delete(CacheKeys.inventory(storeId));
      await this.redisService.delete(CacheKeys.lowStock(storeId));
      await this.redisService.deleteByPattern(
        CacheKeys.sellerProductsPattern(storeId),
      );
    }

    return {
      message: result.message,
      order: result.order,
    };
  }
}
