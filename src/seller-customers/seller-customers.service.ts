import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { eq, and, desc, sql, ilike, or } from 'drizzle-orm';

import { DRIZZLE } from '../db/database.types';
import { orders, orderItems } from '../db/schema/orders.schema';
import { stores } from '../db/schema/stores.schema';
import { buyers } from '../db/schema/buyers.schema';
import { QuerySellerCustomersDto } from './dto/query-seller-customers.dto';

@Injectable()
export class SellerCustomersService {
  constructor(@Inject(DRIZZLE) private readonly db: any) { }

  async validateStoreOwnership(
    sellerId: string,
    storeId: string,
  ) {
    const [store] = await this.db
      .select()
      .from(stores)
      .where(
        and(
          eq(stores.id, storeId),
          eq(stores.sellerId, sellerId),
        ),
      )
      .limit(1);

    if (!store) {
      throw new NotFoundException(
        'Store not found or unauthorized',
      );
    }

    return store;
  }

  async getStoreCustomers(
    sellerId: string,
    storeId: string,
    query: QuerySellerCustomersDto,
  ) {
    await this.validateStoreOwnership(sellerId, storeId);

    const { search, page = 1, limit = 10 } = query;

    const offset = (page - 1) * limit;

    // Search condition
    const searchCondition = search
      ? or(
        ilike(
          orders.customerName,
          `%${search}%`,
        ),
        ilike(
          orders.customerEmail,
          `%${search}%`,
        ),
        ilike(
          buyers.name,
          `%${search}%`,
        ),
        ilike(
          buyers.email,
          `%${search}%`,
        ),
      )
      : undefined;

    const whereConditions = searchCondition
      ? and(
        eq(orders.storeId, storeId),
        searchCondition,
      )
      : eq(orders.storeId, storeId);

    // Total distinct customers
    const [countResult] = await this.db
      .select({
        count: sql<number>`
          count(
            distinct coalesce(
              ${orders.buyerId}::text,
              ${orders.customerEmail}
            )
          )::int
        `,
      })
      .from(orders)
      .leftJoin(
        buyers,
        eq(orders.buyerId, buyers.id),
      )
      .where(whereConditions);

    const total = countResult?.count || 0;

    const totalPages =
      Math.ceil(total / limit) || 1;

    // Customer summary
    const rawCustomers = await this.db
      .select({
        buyerId: orders.buyerId,

        customerName: sql<string>`
          coalesce(
            max(${buyers.name}),
            max(${orders.customerName})
          )
        `,

        customerEmail: sql<string>`
          coalesce(
            max(${buyers.email}),
            max(${orders.customerEmail})
          )
        `,

        customerPhone: sql<string>`
          max(${buyers.phone})
        `,

        totalOrders: sql<number>`
          count(${orders.id})::int
        `,

        totalSpent: sql<number>`
          coalesce(
            sum(${orders.totalAmount}::numeric),
            0
          )::float
        `,

        firstOrderDate: sql<Date>`
          min(${orders.createdAt})
        `,

        lastOrderDate: sql<Date>`
          max(${orders.createdAt})
        `,
      })
      .from(orders)
      .leftJoin(
        buyers,
        eq(orders.buyerId, buyers.id),
      )
      .where(whereConditions)

      // FIX: buyerId and customerEmail are now
      // included in GROUP BY
      .groupBy(
        orders.buyerId,
        orders.customerEmail,
      )

      .orderBy(
        sql`max(${orders.createdAt}) desc`,
      )

      .limit(limit)
      .offset(offset);

    const items = rawCustomers.map(
      (c: any) => ({
        buyerId: c.buyerId || null,

        customerName: c.customerName,

        customerEmail: c.customerEmail,

        customerPhone: c.customerPhone || null,

        totalOrders: Number(
          c.totalOrders,
        ),

        totalSpent: Number(
          c.totalSpent,
        ),

        firstOrderDate:
          c.firstOrderDate,

        lastOrderDate:
          c.lastOrderDate,
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

  async getCustomerDetails(
    sellerId: string,
    storeId: string,
    buyerIdOrEmail: string,
  ) {
    await this.validateStoreOwnership(
      sellerId,
      storeId,
    );

    // Check whether value is UUID
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        buyerIdOrEmail,
      );

    const customerCondition = isUuid
      ? eq(
        orders.buyerId,
        buyerIdOrEmail,
      )
      : eq(
        orders.customerEmail,
        buyerIdOrEmail,
      );

    const customerOrders = await this.db
      .select({
        order: orders,
        buyer: buyers,
      })
      .from(orders)
      .leftJoin(
        buyers,
        eq(orders.buyerId, buyers.id),
      )
      .where(
        and(
          eq(orders.storeId, storeId),
          customerCondition,
        ),
      )
      .orderBy(
        desc(orders.createdAt),
      );

    if (customerOrders.length === 0) {
      throw new NotFoundException(
        'Customer not found for this store',
      );
    }

    const firstRow =
      customerOrders[0];

    const buyerObj =
      firstRow.buyer;

    const ordObj =
      firstRow.order;

    const totalOrders =
      customerOrders.length;

    const totalSpent =
      customerOrders.reduce(
        (
          sum: number,
          r: any,
        ) =>
          sum +
          Number(
            r.order.totalAmount || 0,
          ),
        0,
      );

    const formattedOrders =
      await Promise.all(
        customerOrders.map(
          async (r: any) => {
            const ord =
              r.order;

            const items =
              await this.db
                .select()
                .from(orderItems)
                .where(
                  eq(
                    orderItems.orderId,
                    ord.id,
                  ),
                );

            return {
              id: ord.id,

              orderNumber:
                ord.orderNumber,

              totalAmount:
                Number(
                  ord.totalAmount,
                ),

              status:
                ord.status,

              paymentMethod:
                ord.paymentMethod,

              paymentStatus:
                ord.paymentStatus,

              createdAt:
                ord.createdAt,

              itemsCount:
                items.length,

              items: items.map(
                (i: any) => ({
                  id: i.id,

                  productId:
                    i.productId,

                  productName:
                    i.productName,

                  quantity:
                    i.quantity,

                  unitPrice:
                    Number(
                      i.unitPrice,
                    ),

                  totalPrice:
                    Number(
                      i.totalPrice,
                    ),
                }),
              ),
            };
          },
        ),
      );

    return {
      customer: {
        buyerId:
          buyerObj?.id ||
          ordObj.buyerId ||
          null,

        name:
          buyerObj?.name ||
          ordObj.customerName,

        email:
          buyerObj?.email ||
          ordObj.customerEmail,

        phone:
          buyerObj?.phone ||
          null,

        totalOrders,

        totalSpent:
          Number(
            totalSpent.toFixed(2),
          ),

        firstOrderDate:
          customerOrders[
            customerOrders.length - 1
          ].order.createdAt,

        lastOrderDate:
          firstRow.order.createdAt,
      },

      orders:
        formattedOrders,
    };
  }
}