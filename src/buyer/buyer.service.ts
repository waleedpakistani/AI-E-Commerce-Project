import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DRIZZLE } from '../db/database.types';
import { buyers } from '../db/schema/buyers.schema';
import { buyerAddresses } from '../db/schema/addresses.schema';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class BuyerService {
  constructor(@Inject(DRIZZLE) private readonly db: any) {}

  async getProfile(buyerId: string) {
    const [buyer] = await this.db
      .select({
        id: buyers.id,
        name: buyers.name,
        email: buyers.email,
        phone: buyers.phone,
        role: buyers.role,
        createdAt: buyers.createdAt,
        updatedAt: buyers.updatedAt,
      })
      .from(buyers)
      .where(eq(buyers.id, buyerId))
      .limit(1);

    if (!buyer) {
      throw new NotFoundException('Buyer profile not found');
    }

    return buyer;
  }

  async updateProfile(buyerId: string, dto: UpdateProfileDto) {
    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.phone !== undefined) updateData.phone = dto.phone;

    const [updated] = await this.db
      .update(buyers)
      .set(updateData)
      .where(eq(buyers.id, buyerId))
      .returning({
        id: buyers.id,
        name: buyers.name,
        email: buyers.email,
        phone: buyers.phone,
        role: buyers.role,
        createdAt: buyers.createdAt,
        updatedAt: buyers.updatedAt,
      });

    if (!updated) {
      throw new NotFoundException('Buyer profile not found');
    }

    return updated;
  }

  async createAddress(buyerId: string, dto: CreateAddressDto) {
    const existingAddresses = await this.db
      .select()
      .from(buyerAddresses)
      .where(eq(buyerAddresses.buyerId, buyerId));

    const isFirstAddress = existingAddresses.length === 0;
    const shouldBeDefault = dto.isDefault || isFirstAddress;

    if (shouldBeDefault && !isFirstAddress) {
      await this.db
        .update(buyerAddresses)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(eq(buyerAddresses.buyerId, buyerId));
    }

    const [newAddress] = await this.db
      .insert(buyerAddresses)
      .values({
        buyerId,
        title: dto.title || 'Home',
        recipientName: dto.recipientName,
        phone: dto.phone,
        addressLine1: dto.addressLine1,
        addressLine2: dto.addressLine2,
        city: dto.city,
        state: dto.state,
        postalCode: dto.postalCode,
        country: dto.country,
        isDefault: shouldBeDefault,
      })
      .returning();

    return newAddress;
  }

  async getAddresses(buyerId: string) {
    return this.db
      .select()
      .from(buyerAddresses)
      .where(eq(buyerAddresses.buyerId, buyerId));
  }

  async getAddressById(buyerId: string, addressId: string) {
    const [address] = await this.db
      .select()
      .from(buyerAddresses)
      .where(
        and(
          eq(buyerAddresses.id, addressId),
          eq(buyerAddresses.buyerId, buyerId),
        ),
      )
      .limit(1);

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    return address;
  }

  async updateAddress(
    buyerId: string,
    addressId: string,
    dto: UpdateAddressDto,
  ) {
    await this.getAddressById(buyerId, addressId);

    if (dto.isDefault) {
      await this.db
        .update(buyerAddresses)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(eq(buyerAddresses.buyerId, buyerId));
    }

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.recipientName !== undefined) updateData.recipientName = dto.recipientName;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.addressLine1 !== undefined) updateData.addressLine1 = dto.addressLine1;
    if (dto.addressLine2 !== undefined) updateData.addressLine2 = dto.addressLine2;
    if (dto.city !== undefined) updateData.city = dto.city;
    if (dto.state !== undefined) updateData.state = dto.state;
    if (dto.postalCode !== undefined) updateData.postalCode = dto.postalCode;
    if (dto.country !== undefined) updateData.country = dto.country;
    if (dto.isDefault !== undefined) updateData.isDefault = dto.isDefault;

    const [updated] = await this.db
      .update(buyerAddresses)
      .set(updateData)
      .where(
        and(
          eq(buyerAddresses.id, addressId),
          eq(buyerAddresses.buyerId, buyerId),
        ),
      )
      .returning();

    return updated;
  }

  async deleteAddress(buyerId: string, addressId: string) {
    const address = await this.getAddressById(buyerId, addressId);

    await this.db
      .delete(buyerAddresses)
      .where(
        and(
          eq(buyerAddresses.id, addressId),
          eq(buyerAddresses.buyerId, buyerId),
        ),
      );

    if (address.isDefault) {
      const [remaining] = await this.db
        .select()
        .from(buyerAddresses)
        .where(eq(buyerAddresses.buyerId, buyerId))
        .limit(1);

      if (remaining) {
        await this.db
          .update(buyerAddresses)
          .set({ isDefault: true, updatedAt: new Date() })
          .where(eq(buyerAddresses.id, remaining.id));
      }
    }

    return { message: 'Address deleted successfully' };
  }

  async setDefaultAddress(buyerId: string, addressId: string) {
    await this.getAddressById(buyerId, addressId);

    await this.db
      .update(buyerAddresses)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(eq(buyerAddresses.buyerId, buyerId));

    const [updated] = await this.db
      .update(buyerAddresses)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(
        and(
          eq(buyerAddresses.id, addressId),
          eq(buyerAddresses.buyerId, buyerId),
        ),
      )
      .returning();

    return updated;
  }
}
