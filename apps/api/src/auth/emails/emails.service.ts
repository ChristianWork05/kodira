import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailsService {
  private readonly logger = new Logger(EmailsService.name);

  constructor(private readonly config: ConfigService) {}

  async sendVerifyEmail(params: { to: string; verifyUrl: string }) {
    const subject = 'Verifica tu email en KODIRA';
    const html = `
      <div style="font-family: Inter, Arial, sans-serif; line-height: 1.4">
        <h2>Verifica tu email</h2>
        <p>Haz clic en el siguiente enlace para verificar tu email:</p>
        <p><a href="${params.verifyUrl}">${params.verifyUrl}</a></p>
      </div>
    `;
    await this.sendEmail({ to: params.to, subject, html });
  }

  async sendResetPasswordEmail(params: { to: string; resetUrl: string }) {
    const subject = 'Restablecer contraseña en KODIRA';
    const html = `
      <div style="font-family: Inter, Arial, sans-serif; line-height: 1.4">
        <h2>Restablecer contraseña</h2>
        <p>Haz clic en el enlace para crear una nueva contraseña:</p>
        <p><a href="${params.resetUrl}">${params.resetUrl}</a></p>
      </div>
    `;
    await this.sendEmail({ to: params.to, subject, html });
  }

  private async sendEmail(params: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    const from = this.config.get<string>('RESEND_FROM_EMAIL');

    if (!apiKey || !from) {
      this.logger.warn(
        'RESEND_API_KEY/RESEND_FROM_EMAIL no configuradas. Email se omite (no-op).',
      );
      return;
    }

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [params.to],
          subject: params.subject,
          html: params.html,
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        this.logger.warn(
          `Resend error: ${res.status} ${res.statusText} ${text}`.slice(0, 500),
        );
      }
    } catch (err) {
      this.logger.warn(
        `Resend exception: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}

