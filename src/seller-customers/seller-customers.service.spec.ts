import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { SellerCustomersService } from './seller-customers.service';

describe('SellerCustomersService', () => {
  let service: SellerCustomersService;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      select: vi.fn(),
      from: vi.fn(),
      where: vi.fn(),
      limit: vi.fn(),
      leftJoin: vi.fn(),
    };

    service = new SellerCustomersService(mockDb);
  });

  describe('validateStoreOwnership', () => {
    it('should throw NotFoundException if store is unauthorized', async () => {
      mockDb.select.mockReturnValue(mockDb);
      mockDb.from.mockReturnValue(mockDb);
      mockDb.where.mockReturnValue(mockDb);
      mockDb.limit.mockResolvedValue([]);

      await expect(
        service.validateStoreOwnership('seller-1', 'store-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
