import {
  Controller,
  Get,
  Post,
  Delete,
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
import { WishlistService } from './wishlist.service';

@Controller('buyer/wishlist')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('BUYER')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  async getWishlist(@CurrentBuyer() buyer: CurrentBuyerPayload) {
    return this.wishlistService.getWishlist(buyer.id);
  }

  @Post(':productId')
  async addToWishlist(
    @CurrentBuyer() buyer: CurrentBuyerPayload,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    return this.wishlistService.addToWishlist(buyer.id, productId);
  }

  @Delete(':productId')
  async removeFromWishlist(
    @CurrentBuyer() buyer: CurrentBuyerPayload,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    return this.wishlistService.removeFromWishlist(buyer.id, productId);
  }
}
