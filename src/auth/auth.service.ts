import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

import { DRIZZLE } from '../db/database.types';
import { sellers } from '../db/schema/sellers.schema';
import { stores } from '../db/schema/stores.schema';
import { buyers } from '../db/schema/buyers.schema';

import { RegisterSellerDto } from './dto/register-seller.dto';
import { LoginSellerDto } from './dto/login-seller.dto';
import { RegisterBuyerDto } from './dto/register-buyer.dto';
import { LoginBuyerDto } from './dto/login-buyer.dto';

export interface AuthResponse {
  seller: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    createdAt: Date;
  };

  store: {
    id: string;
    sellerId: string;
    name: string;
    slug: string;
    description: string | null;
    status: string;
    createdAt: Date;
  };

  accessToken: string;
}

export interface BuyerAuthResponse {
  buyer: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    role: string;
    createdAt: Date;
  };

  accessToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE) private readonly db: any,
    private readonly jwtService: JwtService,
  ) {}

  // =========================
  // SELLER REGISTER
  // =========================

  async registerSeller(dto: RegisterSellerDto): Promise<AuthResponse> {
    const email = dto.email.toLowerCase();

    const existingSellers = await this.db
      .select()
      .from(sellers)
      .where(eq(sellers.email, email))
      .limit(1);

    if (existingSellers.length > 0) {
      throw new ConflictException(
        'A seller account with this email already exists',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const { newSeller, newStore } = await this.db.transaction(
      async (tx: any) => {
        // Create Seller
        const [seller] = await tx
          .insert(sellers)
          .values({
            name: dto.name,
            email,
            password: hashedPassword,
            phone: dto.phone,
            role: 'SELLER',
          })
          .returning();

        // Create Store
        const [store] = await tx
          .insert(stores)
          .values({
            sellerId: seller.id,
            name: dto.storeName,
            slug: dto.storeSlug,
            description: 'Official Seller Store',
          })
          .returning();

        return {
          newSeller: seller,
          newStore: store,
        };
      },
    );

    const accessToken = this.jwtService.sign({
      sub: newSeller.id,
      email: newSeller.email,
      role: newSeller.role,
    });

    return {
      seller: {
        id: newSeller.id,
        name: newSeller.name,
        email: newSeller.email,
        phone: newSeller.phone,
        role: newSeller.role,
        createdAt: newSeller.createdAt,
      },

      store: {
        id: newStore.id,
        sellerId: newStore.sellerId,
        name: newStore.name,
        slug: newStore.slug,
        description: newStore.description,
        status: newStore.status,
        createdAt: newStore.createdAt,
      },

      accessToken,
    };
  }

  // =========================
  // SELLER LOGIN
  // =========================

  async loginSeller(dto: LoginSellerDto): Promise<AuthResponse> {
    const email = dto.email.toLowerCase();

    const [seller] = await this.db
      .select()
      .from(sellers)
      .where(eq(sellers.email, email))
      .limit(1);

    if (!seller) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      seller.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const [store] = await this.db
      .select()
      .from(stores)
      .where(eq(stores.sellerId, seller.id))
      .limit(1);

    if (!store) {
      throw new UnauthorizedException(
        'Seller store was not found',
      );
    }

    const accessToken = this.jwtService.sign({
      sub: seller.id,
      email: seller.email,
      role: seller.role,
    });

    return {
      seller: {
        id: seller.id,
        name: seller.name,
        email: seller.email,
        phone: seller.phone,
        role: seller.role,
        createdAt: seller.createdAt,
      },

      store: {
        id: store.id,
        sellerId: store.sellerId,
        name: store.name,
        slug: store.slug,
        description: store.description,
        status: store.status,
        createdAt: store.createdAt,
      },

      accessToken,
    };
  }

  // =========================
  // BUYER REGISTER
  // =========================

  async registerBuyer(
    dto: RegisterBuyerDto,
  ): Promise<BuyerAuthResponse> {
    const email = dto.email.toLowerCase();

    const existingBuyers = await this.db
      .select()
      .from(buyers)
      .where(eq(buyers.email, email))
      .limit(1);

    if (existingBuyers.length > 0) {
      throw new ConflictException(
        'A buyer account with this email already exists',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const [newBuyer] = await this.db
      .insert(buyers)
      .values({
        name: dto.name,
        email,
        password: hashedPassword,
        phone: dto.phone,
        role: 'BUYER',
      })
      .returning();

    const accessToken = this.jwtService.sign({
      sub: newBuyer.id,
      email: newBuyer.email,
      role: newBuyer.role,
    });

    return {
      buyer: {
        id: newBuyer.id,
        name: newBuyer.name,
        email: newBuyer.email,
        phone: newBuyer.phone,
        role: newBuyer.role,
        createdAt: newBuyer.createdAt,
      },

      accessToken,
    };
  }

  // =========================
  // BUYER LOGIN
  // =========================

  async loginBuyer(
    dto: LoginBuyerDto,
  ): Promise<BuyerAuthResponse> {
    const email = dto.email.toLowerCase();

    const [buyer] = await this.db
      .select()
      .from(buyers)
      .where(eq(buyers.email, email))
      .limit(1);

    if (!buyer) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      buyer.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    const accessToken = this.jwtService.sign({
      sub: buyer.id,
      email: buyer.email,
      role: buyer.role,
    });

    return {
      buyer: {
        id: buyer.id,
        name: buyer.name,
        email: buyer.email,
        phone: buyer.phone,
        role: buyer.role,
        createdAt: buyer.createdAt,
      },

      accessToken,
    };
  }
}