// partner-auth.controller.ts
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Req,
  Res,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PartnerAuthService } from './partner-auth.service';
import { IsPublic } from 'src/common/decorators/is-public.decorator';
import {
  PartnerSignupDto,
  PartnerSigninDto,
  CheckEmailDto,
  CheckPhoneDto,
  RefreshTokenDto,
  ResetPasswordDto,
} from './dto/partner-auth.dto';
import { ZodValidationPipe } from 'src/middleware/zod-validation.pipe';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/middleware/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuthUser } from 'src/common/decorators/auth-user.decorator'; // AuthPartner 대신 AuthUser 사용
import { Request, Response } from 'express';
import { Role } from 'src/modules/users/entity/user.entity';

@Controller('partner-auth')
@ApiTags('PartnerAuth')
export class PartnerAuthController {
  private readonly logger = new Logger(PartnerAuthController.name);

  constructor(private readonly authService: PartnerAuthService) {}

  // 회원가입
  @Post('signup')
  @IsPublic()
  @ApiOperation({ summary: '파트너 회원가입' })
  @ApiBody({ type: PartnerSignupDto })
  @UsePipes(new ZodValidationPipe(PartnerSignupDto.schema))
  async signup(@Body() signUpDto: PartnerSignupDto): Promise<{ id: string }> {
    return await this.authService.signup(signUpDto);
  }

  // 이메일 로그인
  @Post('login')
  @IsPublic()
  @ApiOperation({
    summary: '파트너 로그인',
    description: '이메일로 파트너 로그인을 합니다.',
  })
  @ApiBody({ type: PartnerSigninDto })
  async login(
    @Body(new ZodValidationPipe(PartnerSigninDto.schema))
    logInDto: PartnerSigninDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string; email: string }> {
    return await this.authService.login(logInDto, res);
  }

  // 토큰 조회
  @Get('check-login')
  @ApiOperation({ summary: '파트너 로그인 상태 확인' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.PARTNER)
  @ApiBearerAuth('access-token')
  checkLogin(): string {
    this.logger.verbose('Access token is valid', 'PartnerAuthController');
    return 'token OK';
  }

  // 로그아웃
  @Post('logout')
  @ApiOperation({ summary: '파트너 로그아웃' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.PARTNER)
  @ApiBearerAuth('access-token')
  async logout(
    @AuthUser() partner: { id: string; email: string }, // AuthPartner 대신 AuthUser 사용
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.authService.logout(partner, res);
  }

  // 토큰 갱신
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @IsPublic()
  @ApiOperation({
    summary: '파트너 토큰 갱신',
    description: '리프레시 토큰으로 새로운 액세스 토큰을 발급합니다.',
  })
  @ApiBody({ type: RefreshTokenDto })
  async refreshToken(
    @Body() body: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    return await this.authService.refreshAccessToken(body, req, res);
  }

  // 이메일 중복 체크
  @Post('check-email')
  @IsPublic()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '파트너 이메일 중복 확인' })
  @ApiBody({ type: CheckEmailDto })
  async checkEmail(
    @Body(new ZodValidationPipe(CheckEmailDto.schema)) dto: CheckEmailDto,
  ): Promise<{ message: string }> {
    await this.authService.checkEmail(dto.email);
    return { message: '사용 가능한 이메일입니다.' };
  }

  // 전화번호 중복 체크
  @Post('check-phone')
  @IsPublic()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '파트너 전화번호 중복 확인' })
  @ApiBody({ type: CheckPhoneDto })
  async checkPhone(
    @Body(new ZodValidationPipe(CheckPhoneDto.schema)) dto: CheckPhoneDto,
  ): Promise<{ message: string }> {
    await this.authService.checkPhone(dto.phone_number);
    return { message: '사용 가능한 전화번호입니다.' };
  }

  // 비밀번호 초기화
  @Post('reset-password')
  @IsPublic()
  @ApiOperation({
    summary: '파트너 비밀번호 초기화',
    description: '비밀번호를 재설정합니다.',
  })
  @ApiBody({ type: ResetPasswordDto })
  async resetPassword(
    @Body(new ZodValidationPipe(ResetPasswordDto.schema))
    body: ResetPasswordDto,
  ): Promise<{ success: boolean }> {
    await this.authService.resetPassword(body.token, body.password);
    return { success: true };
  }
}
