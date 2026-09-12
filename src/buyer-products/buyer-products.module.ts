import { Module } from '@nestjs/common';
import { BuyerProductsController } from './buyer-products.controller';
import { BuyerProductsService } from './buyer-products.service';

@Module({
  controllers: [BuyerProductsController],
  providers: [BuyerProductsService],
  exports: [BuyerProductsService],
})
export class BuyerProductsModule {}
