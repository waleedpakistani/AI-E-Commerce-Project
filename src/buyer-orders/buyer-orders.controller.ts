import {
  Controller,
  Get,
  Post,
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
  CurrentBuyer,
  CurrentBuyerPayload,
} from '../common/decorators/current-buyer.decorator';
import { BuyerOrdersService } from './buyer-orders.service';
import { CheckoutDto } from './dto/checkout.dto';
import { QueryBuyerOrdersDto } from './dto/query-buyer-orders.dto';

@Controller('buyer/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('BUYER')
export class BuyerOrdersController {
  constructor(private readonly ordersService: BuyerOrdersService) {}

  @Post('checkout')
  async checkout(
    @CurrentBuyer() buyer: CurrentBuyerPayload,
    @Body() dto: CheckoutDto,
  ) {
    return this.ordersService.checkout(buyer.id, dto);
  }

  @Get()
  async getOrders(
    @CurrentBuyer() buyer: CurrentBuyerPayload,
    @Query() query: QueryBuyerOrdersDto,
  ) {
    return this.ordersService.getOrders(buyer.id, query);
  }

  @Get(':id')
  async getOrderDetails(
    @CurrentBuyer() buyer: CurrentBuyerPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ordersService.getOrderDetails(buyer.id, id);
  }

  @Patch(':id/cancel')
  async cancelOrder(
    @CurrentBuyer() buyer: CurrentBuyerPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ordersService.cancelOrder(buyer.id, id);
  }
}
