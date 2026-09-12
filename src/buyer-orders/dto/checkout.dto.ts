import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class ShippingAddressDto {
  @IsString()
  @IsNotEmpty()
  recipientName: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  addressLine1: string;

  @IsString()
  @IsOptional()
  addressLine2?: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsNotEmpty()
  postalCode: string;

  @IsString()
  @IsNotEmpty()
  country: string;
}

export class CheckoutDto {
  @IsUUID()
  @IsOptional()
  addressId?: string;

  @ValidateNested()
  @Type(() => ShippingAddressDto)
  @IsOptional()
  shippingAddress?: ShippingAddressDto;

  @IsString()
  @IsOptional()
  paymentMethod?: string = 'COD';

  @IsString()
  @IsOptional()
  notes?: string;
}
