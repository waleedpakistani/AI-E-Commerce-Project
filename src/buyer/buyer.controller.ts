import {
  Controller,
  Get,
  Patch,
  Post,
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
import { BuyerService } from './buyer.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Controller('buyer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('BUYER')
export class BuyerController {
  constructor(private readonly buyerService: BuyerService) {}

  @Get('profile')
  async getProfile(@CurrentBuyer() buyer: CurrentBuyerPayload) {
    return this.buyerService.getProfile(buyer.id);
  }

  @Patch('profile')
  async updateProfile(
    @CurrentBuyer() buyer: CurrentBuyerPayload,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.buyerService.updateProfile(buyer.id, dto);
  }

  @Post('addresses')
  async createAddress(
    @CurrentBuyer() buyer: CurrentBuyerPayload,
    @Body() dto: CreateAddressDto,
  ) {
    return this.buyerService.createAddress(buyer.id, dto);
  }

  @Get('addresses')
  async getAddresses(@CurrentBuyer() buyer: CurrentBuyerPayload) {
    return this.buyerService.getAddresses(buyer.id);
  }

  @Get('addresses/:id')
  async getAddressById(
    @CurrentBuyer() buyer: CurrentBuyerPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.buyerService.getAddressById(buyer.id, id);
  }

  @Patch('addresses/:id')
  async updateAddress(
    @CurrentBuyer() buyer: CurrentBuyerPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.buyerService.updateAddress(buyer.id, id, dto);
  }

  @Delete('addresses/:id')
  async deleteAddress(
    @CurrentBuyer() buyer: CurrentBuyerPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.buyerService.deleteAddress(buyer.id, id);
  }

  @Patch('addresses/:id/default')
  async setDefaultAddress(
    @CurrentBuyer() buyer: CurrentBuyerPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.buyerService.setDefaultAddress(buyer.id, id);
  }
}
