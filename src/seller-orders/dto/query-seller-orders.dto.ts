import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { OrderStatusEnum } from './update-order-status.dto';

export class QuerySellerOrdersDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsEnum(OrderStatusEnum)
  @IsOptional()
  status?: OrderStatusEnum;

  @IsString()
  @IsOptional()
  paymentStatus?: string;

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
