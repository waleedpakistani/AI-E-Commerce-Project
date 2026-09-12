import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import {
  CurrentSeller,
  CurrentSellerPayload,
} from '../common/decorators/current-seller.decorator';
import { SellersService } from './sellers.service';
import { UpdateSellerProfileDto } from './dto/update-seller-profile.dto';

@Controller('sellers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SELLER', 'ADMIN')
export class SellersController {
  constructor(private readonly sellersService: SellersService) {}

  @Get('profile')
  async getProfile(@CurrentSeller() seller: CurrentSellerPayload) {
    return this.sellersService.getProfile(seller.id);
  }

  @Patch('profile')
  async updateProfile(
    @CurrentSeller() seller: CurrentSellerPayload,
    @Body() dto: UpdateSellerProfileDto,
  ) {
    return this.sellersService.updateProfile(seller.id, dto);
  }
}
