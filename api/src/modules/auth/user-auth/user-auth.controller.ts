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
import { UserAuthService } from './user-auth.service';
import { IsPublic } from 'src/common/decorators/is-public.decorator';
import { UserSignupDto } from './dto/user-signup.dto';
import { ZodValidationPipe } from 'src/middleware/zod-validation.pipe';
import { UserSigninDto } from './dto/user-signin.dto';
import { AuthGuard } from '@nestjs/passport';
import { AuthUser } from 'src/common/decorators/auth-user.decorator';
import { RolesGuard } from 'src/middleware/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { KakaoOAuthDto } from './dto/kakao-oauth.dto';
import { NaverOAuthDto } from './dto/naver-oauth.dto';
import { CheckEmailDto } from './dto/check-email.dto';
import { CheckPhoneDto } from './dto/check-phone.dto';
import { Request, Response } from 'express';

@Controller('auth/user')
@ApiTags('UserAuth')
export class UserAuthController {
  private readonly logger = new Logger(UserAuthController.name);

  constructor(private readonly authService: UserAuthService) {}

  // 회원가입
  @Post('signup')
  @IsPublic()
  @ApiOperation({ summary: '회원가입' })
  @ApiBody({ type: UserSignupDto })
  @UsePipes(new ZodValidationPipe(UserSignupDto.schema))
  async signup(@Body() signUpDto: UserSignupDto): Promise<{ id: string }> {
    try {
      return await this.authService.signup(signUpDto);
    } catch (error) {
      this.logger.error(
        `Signup failed for email ${signUpDto.email}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // 이메일 로그인
  @Post('login')
  @IsPublic()
  @ApiOperation({ summary: '로그인', description: '이메일로 로그인을 합니다.' })
  @ApiBody({ type: UserSigninDto })
  async login(
    @Body(new ZodValidationPipe(UserSigninDto.schema)) logInDto: UserSigninDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string; email: string }> {
    try {
      return await this.authService.login(logInDto, res);
    } catch (error) {
      this.logger.error(
        `Login failed for email ${logInDto.email}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // 카카오 로그인
  @Post('kakao')
  @IsPublic()
  @ApiOperation({ summary: '카카오 OAuth 로그인 처리' })
  @ApiBody({ type: KakaoOAuthDto })
  @UsePipes(new ZodValidationPipe(KakaoOAuthDto.schema))
  async kakaoLogin(
    @Body() dto: KakaoOAuthDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    try {
      return await this.authService.kakaoLogin(dto, res);
    } catch (error) {
      this.logger.error(`Kakao login failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  // 네이버 로그인
  @Post('naver')
  @IsPublic()
  @ApiOperation({ summary: '네이버 OAuth 로그인 처리' })
  @ApiBody({ type: NaverOAuthDto })
  @UsePipes(new ZodValidationPipe(NaverOAuthDto.schema))
  async naverLogin(
    @Body() dto: NaverOAuthDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    try {
      return await this.authService.naverLogin(dto, res);
    } catch (error) {
      this.logger.error(`Naver login failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  // 토큰 조회
  @Get('check-login')
  @ApiOperation({ summary: '로그인 상태 확인' })
  @UseGuards(AuthGuard('jwt'))
  @Roles('user')
  @ApiBearerAuth('access-token')
  async checkLogin(): Promise<string> {
    this.logger.verbose('Access token is valid', 'UserAuthController');
    return 'token OK';
  }

  // 로그아웃
  @Post('logout')
  @ApiOperation({ summary: '로그아웃' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('user')
  @ApiBearerAuth('access-token')
  async logout(
    @AuthUser() user: { id: string; email: string },
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    try {
      await this.authService.logout(user, res);
    } catch (error) {
      this.logger.error(
        `Logout failed for user ${user.id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // 토큰 갱신
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @IsPublic()
  @ApiOperation({
    summary: '토큰 갱신',
    description: '리프레시 토큰으로 새로운 액세스 토큰을 발급합니다.',
  })
  @ApiBody({ type: RefreshTokenDto })
  async refreshToken(
    @Body() body: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    try {
      return await this.authService.refreshAccessToken(body, req, res);
    } catch (error) {
      this.logger.error(`Token refresh failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  // 이메일 중복 체크
  @Post('check-email')
  @IsPublic()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '이메일 중복 확인' })
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
  @ApiOperation({ summary: '전화번호 중복 확인' })
  @ApiBody({ type: CheckPhoneDto })
  async checkPhone(
    @Body(new ZodValidationPipe(CheckPhoneDto.schema)) dto: CheckPhoneDto,
  ): Promise<{ message: string }> {
    await this.authService.checkPhone(dto.phone);
    return { message: '사용 가능한 전화번호입니다.' };
  }

  // 비밀번호 찾기 (이메일로 재설정 링크 전송)
  @Post('forgot-password')
  @IsPublic()
  @ApiOperation({
    summary: '비밀번호 찾기',
    description: '비밀번호 재설정 링크를 이메일로 전송합니다.',
  })
  @ApiBody({ type: ForgotPasswordDto })
  async forgotPassword(
    @Body(new ZodValidationPipe(ForgotPasswordDto.schema))
    body: ForgotPasswordDto,
  ): Promise<void> {
    try {
      await this.authService.forgotPassword(body.email);
    } catch (error) {
      this.logger.error(
        `Forgot password failed for email ${body.email}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // 비밀번호 초기화
  @Post('reset-password')
  @IsPublic()
  @ApiOperation({
    summary: '비밀번호 초기화',
    description: '비밀번호를 재설정합니다.',
  })
  @ApiBody({ type: ResetPasswordDto })
  async resetPassword(
    @Body(new ZodValidationPipe(ResetPasswordDto.schema))
    body: ResetPasswordDto,
  ): Promise<{ success: boolean }> {
    try {
      await this.authService.resetPassword(body.token, body.password);
      return { success: true };
    } catch (error) {
      this.logger.error(`Password reset failed: ${error.message}`, error.stack);
      throw error;
    }
  }
}
