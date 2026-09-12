import {
  Controller,
  Get,
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
import { SellerCustomersService } from './seller-customers.service';
import { QuerySellerCustomersDto } from './dto/query-seller-customers.dto';

@Controller('stores/:storeId/customers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SELLER', 'ADMIN')
export class SellerCustomersController {
  constructor(
    private readonly sellerCustomersService: SellerCustomersService,
  ) { }

  @Get()
  async getStoreCustomers(
    @CurrentSeller() seller: CurrentSellerPayload,
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Query() query: QuerySellerCustomersDto,
  ) {
    return this.sellerCustomersService.getStoreCustomers(
      seller.id,
      storeId,
      query,
    );
  }

  @Get(':id')
  async getCustomerDetails(
    @CurrentSeller() seller: CurrentSellerPayload,
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Param('id') customerIdentifier: string,
  ) {
    return this.sellerCustomersService.getCustomerDetails(
      seller.id,
      storeId,
      customerIdentifier,
    );
  }
}
