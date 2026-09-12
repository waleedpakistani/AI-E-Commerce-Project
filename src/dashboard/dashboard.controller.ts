import { Controller, Get, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import {
  CurrentSeller,
  CurrentSellerPayload,
} from '../common/decorators/current-seller.decorator';
import { DashboardService } from './dashboard.service';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SELLER', 'ADMIN')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) { }

  @Get('dashboard')
  async getOverallDashboard(@CurrentSeller() seller: CurrentSellerPayload) {
    return this.dashboardService.getOverallSellerDashboard(seller.id);
  }

  @Get('stores/:storeId/dashboard')
  async getStoreDashboard(
    @CurrentSeller() seller: CurrentSellerPayload,
    @Param('storeId', ParseUUIDPipe) storeId: string,
  ) {
    return this.dashboardService.getStoreDashboardStats(seller.id, storeId);
  }
}
