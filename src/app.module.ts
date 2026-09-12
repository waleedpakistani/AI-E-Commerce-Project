import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envConfig } from './common/config/env.config';
import { DatabaseModule } from './db/database.module';
import { RedisModule } from './common/redis/redis.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { SellersModule } from './sellers/sellers.module';
import { StoresModule } from './stores/stores.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { BuyerModule } from './buyer/buyer.module';
import { BuyerProductsModule } from './buyer-products/buyer-products.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { CartModule } from './cart/cart.module';
import { BuyerOrdersModule } from './buyer-orders/buyer-orders.module';
import { ReviewsModule } from './reviews/reviews.module';
import { SellerOrdersModule } from './seller-orders/seller-orders.module';
import { SellerCustomersModule } from './seller-customers/seller-customers.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig],
    }),
    DatabaseModule,
    RedisModule,
    HealthModule,
    AuthModule,
    SellersModule,
    StoresModule,
    CategoriesModule,
    ProductsModule,
    DashboardModule,
    BuyerModule,
    BuyerProductsModule,
    WishlistModule,
    CartModule,
    BuyerOrdersModule,
    ReviewsModule,
    SellerOrdersModule,
    SellerCustomersModule,
  ],
})
export class AppModule {}

