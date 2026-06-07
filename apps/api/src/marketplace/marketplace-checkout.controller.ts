import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { CreateCheckoutResponse } from '@kodira/types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserDocument } from '../users/schemas/user.schema';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { CheckoutResponseDto } from './dto/checkout-response.dto';
import { MarketplacePaymentsService } from './marketplace-payments.service';

@ApiTags('Marketplace Checkout')
@Controller('checkout')
export class MarketplaceCheckoutController {
  constructor(private readonly payments: MarketplacePaymentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOkResponse({ type: CheckoutResponseDto })
  async checkout(
    @CurrentUser() user: UserDocument,
    @Body() body: CreateCheckoutDto,
  ): Promise<CreateCheckoutResponse> {
    return this.payments.createCheckout({
      buyerUserId: user._id.toString(),
      offeringId: body.offeringId,
    });
  }
}
