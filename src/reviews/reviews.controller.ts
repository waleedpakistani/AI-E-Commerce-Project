import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import {
  CurrentBuyer,
  CurrentBuyerPayload,
} from '../common/decorators/current-buyer.decorator';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { QueryReviewsDto } from './dto/query-reviews.dto';

@Controller('buyer')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('reviews')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUYER')
  async createReview(
    @CurrentBuyer() buyer: CurrentBuyerPayload,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.createReview(buyer.id, dto);
  }

  @Get('reviews/my-reviews')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUYER')
  async getMyReviews(
    @CurrentBuyer() buyer: CurrentBuyerPayload,
    @Query() query: QueryReviewsDto,
  ) {
    return this.reviewsService.getMyReviews(buyer.id, query);
  }

  @Delete('reviews/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUYER')
  async deleteReview(
    @CurrentBuyer() buyer: CurrentBuyerPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.reviewsService.deleteReview(buyer.id, id);
  }

  @Get('products/:productId/reviews')
  async getProductReviews(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Query() query: QueryReviewsDto,
  ) {
    return this.reviewsService.getProductReviews(productId, query);
  }
}
