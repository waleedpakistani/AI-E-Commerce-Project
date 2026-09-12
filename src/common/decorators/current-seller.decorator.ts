import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentSellerPayload {
  id: string;
  email: string;
  role: string;
}

export const CurrentSeller = createParamDecorator(
  (data: keyof CurrentSellerPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const seller = request.user as CurrentSellerPayload;
    return data ? seller?.[data] : seller;
  },
);
