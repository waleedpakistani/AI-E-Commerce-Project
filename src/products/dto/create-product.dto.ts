import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  IsUUID,
  IsEnum,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  DRAFT = 'DRAFT',
  ARCHIVED = 'ARCHIVED',
}

export class CreateProductDto {
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

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
  price: number;

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
