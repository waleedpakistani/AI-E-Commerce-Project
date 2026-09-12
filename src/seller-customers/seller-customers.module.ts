import { Module } from '@nestjs/common';
import { SellerCustomersController } from './seller-customers.controller';
import { SellerCustomersService } from './seller-customers.service';

@Module({
  controllers: [SellerCustomersController],
  providers: [SellerCustomersService],
  exports: [SellerCustomersService],
})
export class SellerCustomersModule {}
