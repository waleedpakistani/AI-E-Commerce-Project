import { IsNumber, IsOptional, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum StockUpdateAction {
  SET = 'SET',
  ADD = 'ADD',
  SUBTRACT = 'SUBTRACT',
}

export class UpdateStockDto {
  @Type(() => Number)
  @IsNumber()
  quantity: number;

  @IsEnum(StockUpdateAction)
  @IsOptional()
  action?: StockUpdateAction = StockUpdateAction.SET;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  lowStockThreshold?: number;
}
