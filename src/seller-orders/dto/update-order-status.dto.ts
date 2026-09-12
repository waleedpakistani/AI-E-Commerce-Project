import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum OrderStatusEnum {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatusEnum, {
    message:
      'Status must be one of: PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED',
  })
  @IsNotEmpty()
  status: OrderStatusEnum;

  @IsString()
  @IsOptional()
  paymentStatus?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
