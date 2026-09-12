import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
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
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Controller('buyer/cart')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('BUYER')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getCart(@CurrentBuyer() buyer: CurrentBuyerPayload) {
    return this.cartService.getCart(buyer.id);
  }

  @Post()
  async addItem(
    @CurrentBuyer() buyer: CurrentBuyerPayload,
    @Body() dto: AddCartItemDto,
  ) {
    return this.cartService.addItem(buyer.id, dto);
  }

  @Post('items')
  async addItemAlias(
    @CurrentBuyer() buyer: CurrentBuyerPayload,
    @Body() dto: AddCartItemDto,
  ) {
    return this.cartService.addItem(buyer.id, dto);
  }

  @Patch('items/:productId')
  async updateItemQuantity(
    @CurrentBuyer() buyer: CurrentBuyerPayload,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItemQuantity(buyer.id, productId, dto);
  }

  @Delete('items/:productId')
  async removeItem(
    @CurrentBuyer() buyer: CurrentBuyerPayload,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    return this.cartService.removeItem(buyer.id, productId);
  }

  @Delete()
  async clearCart(@CurrentBuyer() buyer: CurrentBuyerPayload) {
    return this.cartService.clearCart(buyer.id);
  }
}
