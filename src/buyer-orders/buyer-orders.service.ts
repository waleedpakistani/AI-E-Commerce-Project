import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { eq, and, desc, sql } from 'drizzle-orm';
import { DRIZZLE } from '../db/database.types';
import { orders, orderItems } from '../db/schema/orders.schema';
import { cartItems } from '../db/schema/carts.schema';
import { products } from '../db/schema/products.schema';
import { buyerAddresses } from '../db/schema/addresses.schema';
import { buyers } from '../db/schema/buyers.schema';
import { stores } from '../db/schema/stores.schema';
import { CheckoutDto } from './dto/checkout.dto';
import { QueryBuyerOrdersDto } from './dto/query-buyer-orders.dto';
import { RedisService } from '../common/redis/redis.service';
import { CacheKeys } from '../common/redis/cache.keys';

@Injectable()
export class BuyerOrdersService {
  constructor(
    @Inject(DRIZZLE) private readonly db: any,
    private readonly redisService: RedisService,
  ) {}

  async checkout(buyerId: string, dto: CheckoutDto) {
    // 1. Get Buyer details
    const [buyer] = await this.db
      .select()
      .from(buyers)
      .where(eq(buyers.id, buyerId))
      .limit(1);

    if (!buyer) {
      throw new NotFoundException('Buyer profile not found');
    }

    // 2. Resolve Shipping Address
    let shippingAddressObj: any = null;

    if (dto.addressId) {
      const [addr] = await this.db
        .select()
        .from(buyerAddresses)
        .where(
          and(
            eq(buyerAddresses.id, dto.addressId),
            eq(buyerAddresses.buyerId, buyerId),
          ),
        )
        .limit(1);

      if (!addr) {
        throw new BadRequestException('Specified shipping address not found');
      }

      shippingAddressObj = {
        recipientName: addr.recipientName,
        phone: addr.phone,
        addressLine1: addr.addressLine1,
        addressLine2: addr.addressLine2,
        city: addr.city,
        state: addr.state,
        postalCode: addr.postalCode,
        country: addr.country,
      };
    } else if (dto.shippingAddress) {
      shippingAddressObj = dto.shippingAddress;
    } else {
      const [defaultAddr] = await this.db
        .select()
        .from(buyerAddresses)
        .where(
          and(
            eq(buyerAddresses.buyerId, buyerId),
            eq(buyerAddresses.isDefault, true),
          ),
        )
        .limit(1);

      if (!defaultAddr) {
        throw new BadRequestException(
          'No shipping address provided and no default address found',
        );
      }

      shippingAddressObj = {
        recipientName: defaultAddr.recipientName,
        phone: defaultAddr.phone,
        addressLine1: defaultAddr.addressLine1,
        addressLine2: defaultAddr.addressLine2,
        city: defaultAddr.city,
        state: defaultAddr.state,
        postalCode: defaultAddr.postalCode,
        country: defaultAddr.country,
      };
    }

    // 3. Execute Transaction
    const result = await this.db.transaction(async (tx: any) => {
      // Fetch cart items with products
      const rawCartItems = await tx
        .select({
          cartItemId: cartItems.id,
          quantity: cartItems.quantity,
          product: products,
        })
        .from(cartItems)
        .innerJoin(products, eq(cartItems.productId, products.id))
        .where(eq(cartItems.buyerId, buyerId));

      if (rawCartItems.length === 0) {
        throw new BadRequestException('Cannot checkout with an empty cart');
      }

      // Validate stock & status
      for (const item of rawCartItems) {
        const p = item.product;
        if (p.status !== 'ACTIVE') {
          throw new BadRequestException(
            `Product "${p.name}" is no longer available for purchase`,
          );
        }
        if (p.stockQuantity < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for "${p.name}". Available: ${p.stockQuantity}, requested: ${item.quantity}`,
          );
        }
      }

      // Deduct stock safely for each product
      for (const item of rawCartItems) {
        const p = item.product;
        const updated = await tx
          .update(products)
          .set({
            stockQuantity: sql`${products.stockQuantity} - ${item.quantity}`,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(products.id, p.id),
              sql`${products.stockQuantity} >= ${item.quantity}`,
            ),
          )
          .returning();

        if (updated.length === 0) {
          throw new BadRequestException(
            `Insufficient stock or concurrent order placed for product "${p.name}"`,
          );
        }
      }

      // Group cart items by storeId
      const storeGroups = new Map<string, typeof rawCartItems>();
      for (const item of rawCartItems) {
        const storeId = item.product.storeId;
        if (!storeGroups.has(storeId)) {
          storeGroups.set(storeId, []);
        }
        storeGroups.get(storeId)!.push(item);
      }

      const createdOrders: any[] = [];

      // Create an order for each store
      for (const [storeId, itemsInStore] of storeGroups.entries()) {
        const orderNumber = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

        let storeTotal = 0;
        const itemInserts: any[] = [];

        for (const ci of itemsInStore) {
          const unitPrice = Number(ci.product.price);
          const totalPrice = unitPrice * ci.quantity;
          storeTotal += totalPrice;

          itemInserts.push({
            productId: ci.product.id,
            productName: ci.product.name,
            quantity: ci.quantity,
            unitPrice: unitPrice.toFixed(2),
            totalPrice: totalPrice.toFixed(2),
          });
        }

        const [newOrder] = await tx
          .insert(orders)
          .values({
            storeId,
            buyerId,
            orderNumber,
            customerName: buyer.name,
            customerEmail: buyer.email,
            shippingAddress: shippingAddressObj,
            paymentMethod: dto.paymentMethod || 'COD',
            paymentStatus: 'PENDING',
            notes: dto.notes,
            totalAmount: storeTotal.toFixed(2),
            status: 'PENDING',
          })
          .returning();

        const createdItems: any[] = [];
        for (const itemData of itemInserts) {
          const [insertedItem] = await tx
            .insert(orderItems)
            .values({
              orderId: newOrder.id,
              ...itemData,
            })
            .returning();
          createdItems.push(insertedItem);
        }

        createdOrders.push({
          ...newOrder,
          totalAmount: Number(newOrder.totalAmount),
          items: createdItems,
        });
      }

      // Clear buyer cart
      await tx.delete(cartItems).where(eq(cartItems.buyerId, buyerId));

      return {
        message: 'Checkout successful',
        ordersCount: createdOrders.length,
        orders: createdOrders,
      };
    });

    // Invalidate product + cart caches (stock and cart state changed)
    await this.redisService.delete(CacheKeys.cart(buyerId));
    await this.redisService.deleteByPattern(CacheKeys.buyerProductsPattern());
    await this.redisService.deleteByPattern(CacheKeys.cartPattern());

    const storeIds = new Set<string>();
    const productIds = new Set<string>();
    for (const order of result.orders) {
      storeIds.add(order.storeId);
      for (const item of order.items) {
        if (item.productId) {
          productIds.add(item.productId);
        }
      }
    }
    for (const pid of productIds) {
      await this.redisService.delete(CacheKeys.product(pid));
      await this.redisService.delete(CacheKeys.buyerProduct(pid));
    }
    for (const sid of storeIds) {
      await this.redisService.deleteByPattern(
        CacheKeys.sellerProductsPattern(sid),
      );
      await this.redisService.delete(CacheKeys.inventory(sid));
      await this.redisService.delete(CacheKeys.lowStock(sid));
    }

    return result;
  }

  async getOrders(buyerId: string, query: QueryBuyerOrdersDto) {
    const { status, page = 1, limit = 10 } = query;

    const conditions = [eq(orders.buyerId, buyerId)];
    if (status) {
      conditions.push(eq(orders.status, status.toUpperCase()));
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
        storeName: stores.name,
        storeSlug: stores.slug,
      })
      .from(orders)
      .leftJoin(stores, eq(orders.storeId, stores.id))
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
          totalAmount: Number(ord.totalAmount),
          status: ord.status,
          paymentMethod: ord.paymentMethod,
          paymentStatus: ord.paymentStatus,
          createdAt: ord.createdAt,
          store: {
            id: ord.storeId,
            name: row.storeName,
            slug: row.storeSlug,
          },
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

  async getOrderDetails(buyerId: string, orderId: string) {
    const [row] = await this.db
      .select({
        order: orders,
        storeName: stores.name,
        storeSlug: stores.slug,
      })
      .from(orders)
      .leftJoin(stores, eq(orders.storeId, stores.id))
      .where(and(eq(orders.id, orderId), eq(orders.buyerId, buyerId)))
      .limit(1);

    if (!row) {
      throw new NotFoundException('Order not found');
    }

    const ord = row.order;

    const itemsList = await this.db
      .select({
        item: orderItems,
        productImage: sql<string>`${products.images}->>0`,
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, ord.id));

    return {
      id: ord.id,
      orderNumber: ord.orderNumber,
      totalAmount: Number(ord.totalAmount),
      status: ord.status,
      paymentMethod: ord.paymentMethod,
      paymentStatus: ord.paymentStatus,
      notes: ord.notes,
      shippingAddress: ord.shippingAddress,
      customerName: ord.customerName,
      customerEmail: ord.customerEmail,
      createdAt: ord.createdAt,
      updatedAt: ord.updatedAt,
      store: {
        id: ord.storeId,
        name: row.storeName,
        slug: row.storeSlug,
      },
      items: itemsList.map((rowItem: any) => ({
        id: rowItem.item.id,
        productId: rowItem.item.productId,
        productName: rowItem.item.productName,
        quantity: rowItem.item.quantity,
        unitPrice: Number(rowItem.item.unitPrice),
        totalPrice: Number(rowItem.item.totalPrice),
        productImage: rowItem.productImage || null,
      })),
      statusHistory: [
        { status: 'PENDING', timestamp: ord.createdAt },
        ...(ord.status !== 'PENDING'
          ? [{ status: ord.status, timestamp: ord.updatedAt }]
          : []),
      ],
    };
  }

  async cancelOrder(buyerId: string, orderId: string) {
    const result = await this.db.transaction(async (tx: any) => {
      const [ord] = await tx
        .select()
        .from(orders)
        .where(and(eq(orders.id, orderId), eq(orders.buyerId, buyerId)))
        .limit(1);

      if (!ord) {
        throw new NotFoundException('Order not found');
      }

      if (ord.status !== 'PENDING') {
        throw new BadRequestException(
          `Cannot cancel order with status "${ord.status}". Only PENDING orders can be cancelled`,
        );
      }

      // Restore stock quantities
      const itemsList = await tx
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));

      const productIds: string[] = [];
      for (const item of itemsList) {
        if (item.productId) {
          productIds.push(item.productId);
          await tx
            .update(products)
            .set({
              stockQuantity: sql`${products.stockQuantity} + ${item.quantity}`,
              updatedAt: new Date(),
            })
            .where(eq(products.id, item.productId));
        }
      }

      const [updatedOrder] = await tx
        .update(orders)
        .set({
          status: 'CANCELLED',
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId))
        .returning();

      return {
        message: 'Order cancelled successfully',
        order: {
          id: updatedOrder.id,
          orderNumber: updatedOrder.orderNumber,
          status: updatedOrder.status,
          updatedAt: updatedOrder.updatedAt,
        },
        productIds,
      };
    });

    // Invalidate caches for affected products + cart (stock restored)
    await this.redisService.delete(CacheKeys.cart(buyerId));
    await this.redisService.deleteByPattern(CacheKeys.buyerProductsPattern());
    await this.redisService.deleteByPattern(CacheKeys.cartPattern());

    for (const pid of result.productIds) {
      await this.redisService.delete(CacheKeys.product(pid));
      await this.redisService.delete(CacheKeys.buyerProduct(pid));
    }

    return {
      message: result.message,
      order: result.order,
    };
  }
}
