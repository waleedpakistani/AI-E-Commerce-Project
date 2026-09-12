import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '../../db/database.types';
import { sellers } from '../../db/schema/sellers.schema';
import { buyers } from '../../db/schema/buyers.schema';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @Inject(DRIZZLE) private readonly db: any,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('jwt.secret') ||
        'super-secret-jwt-key-change-in-production',
    });
  }

  async validate(payload: JwtPayload) {
    const roleUpper = payload.role?.toUpperCase();

    if (roleUpper === 'BUYER') {
      const [buyer] = await this.db
        .select({
          id: buyers.id,
          email: buyers.email,
          name: buyers.name,
          role: buyers.role,
        })
        .from(buyers)
        .where(eq(buyers.id, payload.sub))
        .limit(1);

      if (!buyer) {
        throw new UnauthorizedException('Invalid or expired buyer token');
      }

      return {
        id: buyer.id,
        email: buyer.email,
        name: buyer.name,
        role: (buyer.role || 'BUYER').toUpperCase(),
      };
    }

    const [seller] = await this.db
      .select({
        id: sellers.id,
        email: sellers.email,
        name: sellers.name,
        role: sellers.role,
      })
      .from(sellers)
      .where(eq(sellers.id, payload.sub))
      .limit(1);

    if (!seller) {
      throw new UnauthorizedException('Invalid or expired seller token');
    }

    return {
      id: seller.id,
      email: seller.email,
      name: seller.name,
      role: (seller.role || 'SELLER').toUpperCase(),
    };
  }
}
