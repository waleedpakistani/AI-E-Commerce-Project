import { Controller, Get, Param, Query, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { BuyerProductsService } from './buyer-products.service';
import { BuyerQueryProductsDto } from './dto/buyer-query-products.dto';
import { ThrottleGuard } from '../common/throttling/throttle.guard';
import { Throttle } from '../common/throttling/throttle.decorator';

@UseGuards(ThrottleGuard)
@Throttle({ limit: 60, ttl: 60 })
@Controller('buyer/products')
export class BuyerProductsController {
  constructor(private readonly productsService: BuyerProductsService) {}

  @Get()
  async getProducts(@Query() query: BuyerQueryProductsDto) {
    return this.productsService.getProducts(query);
  }

  @Get(':id')
  async getProductDetails(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.getProductDetails(id);
  }
}
