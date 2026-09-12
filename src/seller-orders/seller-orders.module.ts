import { Module } from '@nestjs/common';
import { SellerOrdersController } from './seller-orders.controller';
import { SellerOrdersService } from './seller-orders.service';

@Module({
  controllers: [SellerOrdersController],
  providers: [SellerOrdersService],
  exports: [SellerOrdersService],
})
export class SellerOrdersModule {}
