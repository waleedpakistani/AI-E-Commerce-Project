import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { QueryProductsDto } from './dto/query-products.dto';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SELLER', 'ADMIN')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post('stores/:storeId/products')
  async createProduct(
    @CurrentSeller() seller: CurrentSellerPayload,
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Body() dto: CreateProductDto,
  ) {
    return this.productsService.createProduct(seller.id, storeId, dto);
  }

  @Get('stores/:storeId/products')
  async getStoreProducts(
    @CurrentSeller() seller: CurrentSellerPayload,
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Query() query: QueryProductsDto,
  ) {
    return this.productsService.getStoreProducts(seller.id, storeId, query);
  }

  @Get('stores/:storeId/inventory')
  async getStoreInventory(
    @CurrentSeller() seller: CurrentSellerPayload,
    @Param('storeId', ParseUUIDPipe) storeId: string,
  ) {
    return this.productsService.getStoreInventory(seller.id, storeId);
  }

  @Get('stores/:storeId/inventory/low-stock')
  async getStoreLowStock(
    @CurrentSeller() seller: CurrentSellerPayload,
    @Param('storeId', ParseUUIDPipe) storeId: string,
  ) {
    return this.productsService.getStoreLowStock(seller.id, storeId);
  }

  @Get('products/:id')
  async getProductById(
    @CurrentSeller() seller: CurrentSellerPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.productsService.getProductById(seller.id, id);
  }

  @Patch('products/:id')
  async updateProduct(
    @CurrentSeller() seller: CurrentSellerPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.updateProduct(seller.id, id, dto);
  }

  @Patch('products/:id/stock')
  async updateProductStock(
    @CurrentSeller() seller: CurrentSellerPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStockDto,
  ) {
    return this.productsService.updateProductStock(seller.id, id, dto);
  }

  @Delete('products/:id')
  async deleteProduct(
    @CurrentSeller() seller: CurrentSellerPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.productsService.deleteProduct(seller.id, id);
  }
}
