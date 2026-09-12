import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentBuyerPayload {
  id: string;
  email: string;
  role: string;
}

export const CurrentBuyer = createParamDecorator(
  (data: keyof CurrentBuyerPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const buyer = request.user as CurrentBuyerPayload;
    return data ? buyer?.[data] : buyer;
  },
);
