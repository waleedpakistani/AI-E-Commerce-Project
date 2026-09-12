import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { AuthService, AuthResponse, BuyerAuthResponse } from './auth.service';
import { RegisterSellerDto } from './dto/register-seller.dto';
import { LoginSellerDto } from './dto/login-seller.dto';
import { RegisterBuyerDto } from './dto/register-buyer.dto';
import { LoginBuyerDto } from './dto/login-buyer.dto';
import { ThrottleGuard } from '../common/throttling/throttle.guard';
import { Throttle } from '../common/throttling/throttle.decorator';

@UseGuards(ThrottleGuard)
@Throttle({ limit: 10, ttl: 60 })
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async registerSeller(@Body() dto: RegisterSellerDto): Promise<AuthResponse> {
    return this.authService.registerSeller(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async loginSeller(@Body() dto: LoginSellerDto): Promise<AuthResponse> {
    return this.authService.loginSeller(dto);
  }

  @Post('buyer/register')
  async registerBuyer(@Body() dto: RegisterBuyerDto): Promise<BuyerAuthResponse> {
    return this.authService.registerBuyer(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('buyer/login')
  async loginBuyer(@Body() dto: LoginBuyerDto): Promise<BuyerAuthResponse> {
    return this.authService.loginBuyer(dto);
  }
}
