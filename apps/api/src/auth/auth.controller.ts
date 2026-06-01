import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshDto } from './dto/refresh.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { AuthTokensDto } from './dto/auth-tokens.dto';
import { OkResponseDto } from '../common/dto/ok-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { UserDocument } from '../users/schemas/user.schema';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(201)
  @ApiCreatedResponse({ type: AuthResponseDto })
  async register(@Body() body: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(body);
  }

  @Post('login')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @ApiOkResponse({ type: AuthResponseDto })
  async login(@Body() body: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(body);
  }

  @Post('refresh')
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @ApiOkResponse({ type: AuthTokensDto })
  async refresh(@Body() body: RefreshDto): Promise<AuthTokensDto> {
    return this.authService.refresh(body.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOkResponse({ type: OkResponseDto })
  async logout(@CurrentUser() user: UserDocument): Promise<OkResponseDto> {
    return this.authService.logout(user._id.toString());
  }

  @Post('forgot-password')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @ApiOkResponse({ type: OkResponseDto })
  async forgotPassword(
    @Body() body: ForgotPasswordDto,
  ): Promise<OkResponseDto> {
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  @ApiOkResponse({ type: OkResponseDto })
  async resetPassword(@Body() body: ResetPasswordDto): Promise<OkResponseDto> {
    return this.authService.resetPassword(body);
  }

  @Post('verify-email')
  @ApiOkResponse({ type: OkResponseDto })
  async verifyEmail(@Body() body: VerifyEmailDto): Promise<OkResponseDto> {
    return this.authService.verifyEmail(body.token);
  }
}

