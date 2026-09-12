import { IsOptional, IsString, IsUUID, IsEnum, IsBoolean, IsInt, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ProductStatus } from './create-product.dto';

export class QueryProductsDto {
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;

  @IsString()
  @IsOptional()
  search?: string;

  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  lowStock?: boolean;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number;
}

