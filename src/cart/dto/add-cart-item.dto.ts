import { IsInt, IsNotEmpty, IsUUID, Min } from 'class-validator';

export class AddCartItemDto {
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number = 1;
}
