import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { BullModule, getQueueToken } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RolesGuard } from './guards/roles.guard';
import { EMAIL_QUEUE, EMAIL_QUEUE_NAME } from './emails/emails.constants';
import { EmailsService } from './emails/emails.service';
import { EmailsProcessor } from './emails/emails.processor';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET');
        if (!secret) throw new Error('JWT_SECRET is required');
        return { secret };
      },
    }),
    BullModule.registerQueue({ name: EMAIL_QUEUE_NAME }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    RolesGuard,
    EmailsService,
    EmailsProcessor,
    // Adaptador para que AuthService dependa de una interfaz estable (EmailQueue),
    // y en tests podamos overridear fácilmente este provider.
    {
      provide: EMAIL_QUEUE,
      inject: [getQueueToken(EMAIL_QUEUE_NAME)],
      useFactory: (queue: Queue) => queue,
    },
  ],
  exports: [AuthService, RolesGuard],
})
export class AuthModule {}

