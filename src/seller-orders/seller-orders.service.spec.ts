import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SellerOrdersService } from './seller-orders.service';
import { OrderStatusEnum } from './dto/update-order-status.dto';

describe('SellerOrdersService', () => {
  let service: SellerOrdersService;
  let mockDb: any;
  let mockRedisService: any;

  beforeEach(() => {
    mockDb = {
      select: vi.fn(),
      from: vi.fn(),
      where: vi.fn(),
      orderBy: vi.fn(),
      limit: vi.fn(),
      offset: vi.fn(),
      leftJoin: vi.fn(),
      update: vi.fn(),
      set: vi.fn(),
      returning: vi.fn(),
      transaction: vi.fn((cb: any) => cb(mockDb)),
    };

    mockRedisService = {
      getJson: vi.fn().mockResolvedValue(null),
      setJson: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      deleteByPattern: vi.fn().mockResolvedValue(undefined),
      ping: vi.fn().mockResolvedValue(true),
    };

    service = new SellerOrdersService(mockDb, mockRedisService);
  });

  describe('validateStoreOwnership', () => {
    it('should throw NotFoundException if store does not belong to seller', async () => {
      mockDb.select.mockReturnValue(mockDb);
      mockDb.from.mockReturnValue(mockDb);
      mockDb.where.mockReturnValue(mockDb);
      mockDb.limit.mockResolvedValue([]);

      await expect(
        service.validateStoreOwnership('seller-1', 'store-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return store if ownership is valid', async () => {
      const mockStore = { id: 'store-1', sellerId: 'seller-1' };
      mockDb.select.mockReturnValue(mockDb);
      mockDb.from.mockReturnValue(mockDb);
      mockDb.where.mockReturnValue(mockDb);
      mockDb.limit.mockResolvedValue([mockStore]);

      const result = await service.validateStoreOwnership('seller-1', 'store-1');
      expect(result).toEqual(mockStore);
    });
  });

  describe('updateOrderStatus', () => {
    it('should throw BadRequestException when trying to update a CANCELLED order', async () => {
      vi.spyOn(service, 'validateStoreOwnership').mockResolvedValue({ id: 'store-1' } as any);

      mockDb.select.mockReturnValue(mockDb);
      mockDb.from.mockReturnValue(mockDb);
      mockDb.where.mockReturnValue(mockDb);
      mockDb.limit.mockResolvedValue([{ id: 'order-1', status: 'CANCELLED' }]);

      await expect(
        service.updateOrderStatus('seller-1', 'store-1', 'order-1', {
          status: OrderStatusEnum.SHIPPED,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
