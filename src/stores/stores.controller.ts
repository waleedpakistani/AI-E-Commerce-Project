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
  CurrentSeller,
  CurrentSellerPayload,
} from '../common/decorators/current-seller.decorator';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

@Controller('stores')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SELLER', 'ADMIN')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  async createStore(
    @CurrentSeller() seller: CurrentSellerPayload,
    @Body() dto: CreateStoreDto,
  ) {
    return this.storesService.createStore(seller.id, dto);
  }

  @Get()
  async getMyStores(@CurrentSeller() seller: CurrentSellerPayload) {
    return this.storesService.getSellerStores(seller.id);
  }

  @Get(':id')
  async getStoreById(
    @CurrentSeller() seller: CurrentSellerPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.storesService.getSellerStoreById(seller.id, id);
  }

  @Patch(':id')
  async updateStore(
    @CurrentSeller() seller: CurrentSellerPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStoreDto,
  ) {
    return this.storesService.updateStore(seller.id, id, dto);
  }

  @Delete(':id')
  async deleteStore(
    @CurrentSeller() seller: CurrentSellerPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.storesService.deleteStore(seller.id, id);
  }
}
