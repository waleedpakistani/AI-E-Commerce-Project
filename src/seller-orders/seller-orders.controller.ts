import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import {
  CurrentSeller,
  CurrentSellerPayload,
} from '../common/decorators/current-seller.decorator';
import { SellerOrdersService } from './seller-orders.service';
import { QuerySellerOrdersDto } from './dto/query-seller-orders.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Controller('stores/:storeId/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SELLER', 'ADMIN')
export class SellerOrdersController {
  constructor(private readonly sellerOrdersService: SellerOrdersService) {}

  @Get()
  async getStoreOrders(
    @CurrentSeller() seller: CurrentSellerPayload,
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Query() query: QuerySellerOrdersDto,
  ) {
    return this.sellerOrdersService.getStoreOrders(seller.id, storeId, query);
  }

  @Get(':orderId')
  async getOrderDetails(
    @CurrentSeller() seller: CurrentSellerPayload,
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    return this.sellerOrdersService.getOrderDetails(
      seller.id,
      storeId,
      orderId,
    );
  }

  @Patch(':orderId/status')
  async updateOrderStatus(
    @CurrentSeller() seller: CurrentSellerPayload,
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.sellerOrdersService.updateOrderStatus(
      seller.id,
      storeId,
      orderId,
      dto,
    );
  }
}
