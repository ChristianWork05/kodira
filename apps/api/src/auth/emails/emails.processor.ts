import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { EMAIL_QUEUE_NAME, type EmailJobName } from './emails.constants';
import { EmailsService } from './emails.service';

/**
 * Worker de BullMQ para emails.
 *
 * Nota: si Resend no está configurado, EmailsService hace no-op.
 */
@Processor(EMAIL_QUEUE_NAME)
export class EmailsProcessor extends WorkerHost {
  constructor(
    private readonly emailsService: EmailsService,
    private readonly config: ConfigService,
  ) {
    super();
  }

  async process(job: Job<Record<string, any>, any, EmailJobName>): Promise<any> {
    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? '';

    switch (job.name) {
      case 'sendVerifyEmail': {
        const verifyUrl =
          job.data.verifyUrl ??
          (frontendUrl
            ? `${frontendUrl.replace(/\/$/, '')}/verify-email?token=${job.data.token}`
            : job.data.token);
        await this.emailsService.sendVerifyEmail({
          to: job.data.to,
          verifyUrl,
        });
        return;
      }
      case 'sendResetPassword': {
        const resetUrl =
          job.data.resetUrl ??
          (frontendUrl
            ? `${frontendUrl.replace(/\/$/, '')}/reset-password?token=${job.data.token}`
            : job.data.token);
        await this.emailsService.sendResetPasswordEmail({
          to: job.data.to,
          resetUrl,
        });
        return;
      }
      default:
        return;
    }
  }
}

