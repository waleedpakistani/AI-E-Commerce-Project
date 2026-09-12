import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { eq, and, ne } from 'drizzle-orm';
import { DRIZZLE } from '../db/database.types';
import { sellers } from '../db/schema/sellers.schema';
import { UpdateSellerProfileDto } from './dto/update-seller-profile.dto';

@Injectable()
export class SellersService {
  constructor(@Inject(DRIZZLE) private readonly db: any) {}

  async getProfile(sellerId: string) {
    const [seller] = await this.db
      .select({
        id: sellers.id,
        name: sellers.name,
        email: sellers.email,
        role: sellers.role,
        createdAt: sellers.createdAt,
        updatedAt: sellers.updatedAt,
      })
      .from(sellers)
      .where(eq(sellers.id, sellerId))
      .limit(1);

    if (!seller) {
      throw new NotFoundException('Seller profile not found');
    }

    return seller;
  }

  async updateProfile(sellerId: string, dto: UpdateSellerProfileDto) {
    const [existingSeller] = await this.db
      .select()
      .from(sellers)
      .where(eq(sellers.id, sellerId))
      .limit(1);

    if (!existingSeller) {
      throw new NotFoundException('Seller profile not found');
    }

    const updateData: Partial<typeof sellers.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (dto.name) {
      updateData.name = dto.name;
    }

    if (dto.email && dto.email.toLowerCase() !== existingSeller.email) {
      const emailConflicts = await this.db
        .select()
        .from(sellers)
        .where(
          and(
            eq(sellers.email, dto.email.toLowerCase()),
            ne(sellers.id, sellerId),
          ),
        )
        .limit(1);

      if (emailConflicts.length > 0) {
        throw new ConflictException('Email address is already taken');
      }
      updateData.email = dto.email.toLowerCase();
    }

    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, 10);
    }

    const [updatedSeller] = await this.db
      .update(sellers)
      .set(updateData)
      .where(eq(sellers.id, sellerId))
      .returning({
        id: sellers.id,
        name: sellers.name,
        email: sellers.email,
        role: sellers.role,
        createdAt: sellers.createdAt,
        updatedAt: sellers.updatedAt,
      });

    return updatedSeller;
  }
}
