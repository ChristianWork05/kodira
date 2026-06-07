import { Controller, Post, Req } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { OkResponseDto } from '../common/dto/ok-response.dto';
import { MarketplacePaymentsService } from './marketplace-payments.service';

@ApiTags('Webhooks')
@Controller('webhooks')
export class MarketplaceWebhooksController {
  constructor(private readonly payments: MarketplacePaymentsService) {}

  @Post('stripe')
  @ApiOkResponse({ type: OkResponseDto })
  async stripe(@Req() req: Request): Promise<OkResponseDto> {
    const anyReq = req as any;
    const candidate = anyReq?.rawBody ?? req.body;
    const rawBody = Buffer.isBuffer(candidate) ? candidate : Buffer.from(candidate as any);
    const signature = req.headers['stripe-signature'];
    await this.payments.handleStripeWebhook({ rawBody, signature });
    return { ok: true };
  }
}
