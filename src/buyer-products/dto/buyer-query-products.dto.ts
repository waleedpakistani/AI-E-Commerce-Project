import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export enum ProductSortBy {
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  NEWEST = 'newest',
}

export class BuyerQueryProductsDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsUUID()
  @IsOptional()
  storeId?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  minPrice?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  maxPrice?: number;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  inStockOnly?: boolean;

  @IsEnum(ProductSortBy)
  @IsOptional()
  sortBy?: ProductSortBy;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 10;
}
