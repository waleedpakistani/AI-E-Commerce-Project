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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SELLER', 'ADMIN')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) { }

  @Post('stores/:storeId/categories')
  async createCategory(
    @CurrentSeller() seller: CurrentSellerPayload,
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.categoriesService.createCategory(seller.id, storeId, dto);
  }

  @Get('stores/:storeId/categories')
  async getStoreCategories(
    @CurrentSeller() seller: CurrentSellerPayload,
    @Param('storeId', ParseUUIDPipe) storeId: string,
  ) {
    return this.categoriesService.getStoreCategories(seller.id, storeId);
  }

  @Get('categories/:id')
  async getCategoryById(
    @CurrentSeller() seller: CurrentSellerPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.categoriesService.getCategoryById(seller.id, id);
  }

  @Patch('categories/:id')
  async updateCategory(
    @CurrentSeller() seller: CurrentSellerPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.updateCategory(seller.id, id, dto);
  }

  @Delete('categories/:id')
  async deleteCategory(
    @CurrentSeller() seller: CurrentSellerPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.categoriesService.deleteCategory(seller.id, id);
  }
}
