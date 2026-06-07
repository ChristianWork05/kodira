import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import type { CompleteOrderResponse, DeliverOrderResponse } from '@kodira/types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserDocument } from '../users/schemas/user.schema';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { MarketplacePaymentsService } from './marketplace-payments.service';
import { OrderResponseDto } from './dto/order-response.dto';

@ApiTags('Marketplace Orders')
@Controller('orders')
export class MarketplaceOrdersController {
  constructor(private readonly payments: MarketplacePaymentsService) {}

  @Post(':id/deliver')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('seller')
  @ApiBearerAuth('bearer')
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: OrderResponseDto })
  async deliver(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
  ): Promise<DeliverOrderResponse> {
    const order = await this.payments.deliverFixedPackage({
      sellerUserId: user._id.toString(),
      orderId: id,
    });
    return { order };
  }

  @Post(':id/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: OrderResponseDto })
  async complete(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
  ): Promise<CompleteOrderResponse> {
    const order = await this.payments.completeFixedPackage({
      buyerUserId: user._id.toString(),
      orderId: id,
    });
    return { order };
  }
}
