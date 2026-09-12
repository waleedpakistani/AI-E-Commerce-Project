import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsUUID,
  IsEnum,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductStatus } from './create-product.dto';

export class UpdateProductDto {
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  sku?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  stockQuantity?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  lowStockThreshold?: number;
}
