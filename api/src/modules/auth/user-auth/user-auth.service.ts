import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Knex } from 'knex';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from 'src/common/redis.service';
import { UserSignupDto } from './dto/user-signup.dto';
import { UserSigninDto } from './dto/user-signin.dto';
import { KakaoOAuthDto } from './dto/kakao-oauth.dto';
import { NaverOAuthDto } from './dto/naver-oauth.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { jwtConstants } from 'src/common/constants/constants';
// import { createPasswordResetContent } from 'src/utils/email.utils';

interface User {
  id: string;
  email: string;
  password: string | null;
  social_provider: 'kakao' | 'naver' | 'apple' | null;
  social_id: string | null;
  phone: string | null;
  points: number;
  push_notification_enabled: boolean;
  created_at: Date;
  updated_at: Date;
  revoked_at: Date | null;
}

@Injectable()
export class UserAuthService {
  private readonly logger = new Logger(UserAuthService.name);

  constructor(
    @Inject('KNEX_CONNECTION') private readonly knex: Knex,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {}

  // 회원가입
  async signup(signupDto: UserSignupDto): Promise<{ id: string }> {
    try {
      const { email, password, phone } = signupDto;

      // 이메일 및 전화번호 중복 체크
      await this.checkEmail(email);
      if (phone) await this.checkPhone(phone);

      const hashedPassword = await this.hashPassword(password);
      const userId = uuidv4();

      await this.knex<User>('users').insert({
        id: userId,
        email,
        password: hashedPassword,
        phone,
        points: 0,
        push_notification_enabled: true,
        created_at: new Date(),
        updated_at: new Date(),
      });

      this.logger.verbose(`User created: ${email}`);
      return { id: userId };
    } catch (error) {
      this.logger.error(
        `Signup failed for email ${signupDto.email}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // 이메일 로그인
  async login(
    signInDto: UserSigninDto,
    res: Response,
  ): Promise<{ accessToken: string; email: string }> {
    try {
      const { email, password } = signInDto;
      const user = await this.knex<User>('users')
        .where({ email, revoked_at: null })
        .first();

      if (!user) {
        this.logger.warn(`Login failed: email ${email} not found`);
        throw new UnauthorizedException(
          '이메일 또는 비밀번호가 잘못되었습니다.',
        );
      }

      if (!user.password) {
        this.logger.warn(
          `Login failed: user ${user.id} has no password (social login user)`,
        );
        throw new UnauthorizedException(
          '소셜 로그인 사용자는 이메일로 로그인할 수 없습니다.',
        );
      }

      const isPasswordValid = await this.validatePassword(
        password,
        user.password,
      );
      if (!isPasswordValid) {
        this.logger.warn(`Invalid password attempt for user ${user.id}`);
        throw new UnauthorizedException(
          '이메일 또는 비밀번호가 잘못되었습니다.',
        );
      }

      const { accessToken, refreshToken } = await this.generateTokens({
        id: user.id,
        email: user.email,
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/api/auth/user',
      });

      this.logger.verbose(`Login successful for user ${user.id}`);
      return { accessToken, email: user.email };
    } catch (error) {
      this.logger.error(
        `Login error for email ${signInDto.email}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // 카카오 로그인
  async kakaoLogin(
    oauthDto: KakaoOAuthDto,
    res: Response,
  ): Promise<{ accessToken: string }> {
    try {
      // 1. 카카오 토큰 요청
      const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY!,
          redirect_uri: oauthDto.redirectUri,
          code: oauthDto.code,
        }),
      });
      const tokenJson = await tokenRes.json();
      const kakaoAccessToken = tokenJson.access_token;
      if (!kakaoAccessToken) {
        this.logger.error(
          `Kakao token issuance failed: ${JSON.stringify(tokenJson)}`,
        );
        throw new BadRequestException('카카오 토큰 발급 실패');
      }

      // 2. 카카오 프로필 요청
      const userRes = await fetch('https://kapi.kakao.com/v2/user/me', {
        headers: { Authorization: `Bearer ${kakaoAccessToken}` },
      });
      const userInfo = await userRes.json();

      // 3. 전화번호 가공
      let phone = userInfo.kakao_account?.phone_number ?? '';
      if (phone.startsWith('+82')) phone = phone.slice(3);
      phone = phone.replace(/[\s-]/g, '');
      if (phone && !phone.startsWith('0')) phone = '0' + phone;

      // 4. 사용자 조회 또는 생성
      let user = await this.knex<User>('users')
        .where({
          social_id: String(userInfo.id),
          social_provider: 'kakao',
          revoked_at: null,
        })
        .first();

      if (!user) {
        const userId = uuidv4();
        const email =
          userInfo.kakao_account?.email ?? `kakao_${userInfo.id}@example.com`;
        await this.knex<User>('users').insert({
          id: userId,
          email,
          social_provider: 'kakao',
          social_id: String(userInfo.id),
          phone: phone || null,
          points: 0,
          push_notification_enabled: true,
          created_at: new Date(),
          updated_at: new Date(),
        });
        user = await this.knex<User>('users').where({ id: userId }).first();
      } else if (phone && !user.phone) {
        await this.knex<User>('users')
          .where({ id: user.id })
          .update({ phone, updated_at: new Date() });
      }

      // 5. 토큰 생성
      const { accessToken, refreshToken } = await this.generateTokens({
        id: user!.id,
        email: user!.email,
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/api/auth/user',
      });

      this.logger.verbose(`Kakao login successful for user ${user!.id}`);
      return { accessToken };
    } catch (error) {
      this.logger.error(`Kakao login error: ${error.message}`, error.stack);
      throw error;
    }
  }

  // 네이버 로그인
  async naverLogin(
    oauthDto: NaverOAuthDto,
    res: Response,
  ): Promise<{ accessToken: string }> {
    try {
      // 1. 네이버 토큰 요청
      const tokenRes = await fetch(
        `https://nid.naver.com/oauth2.0/token?grant_type=authorization_code` +
          `&client_id=${process.env.NAVER_CLIENT_ID}` +
          `&client_secret=${process.env.NAVER_CLIENT_SECRET}` +
          `&code=${oauthDto.code}` +
          `&state=${oauthDto.state}`,
        { method: 'GET' },
      );
      const tokenData = await tokenRes.json();
      const { access_token: naverAccessToken } = tokenData;
      if (!naverAccessToken) {
        this.logger.error(
          `Naver token issuance failed: ${JSON.stringify(tokenData)}`,
        );
        throw new BadRequestException('네이버 토큰 발급 실패');
      }

      // 2. 네이버 프로필 요청
      const userRes = await fetch('https://openapi.naver.com/v1/nid/me', {
        headers: { Authorization: `Bearer ${naverAccessToken}` },
      });
      const { response: profile } = await userRes.json();

      // 3. 전화번호 가공
      let phone = profile.mobile ?? '';
      if (phone.startsWith('+82')) phone = phone.slice(3);
      phone = phone.replace(/[\s-]/g, '');
      if (phone && !phone.startsWith('0')) phone = '0' + phone;

      // 4. 사용자 조회 또는 생성
      let user = await this.knex<User>('users')
        .where({
          social_id: String(profile.id),
          social_provider: 'naver',
          revoked_at: null,
        })
        .first();

      if (!user) {
        const userId = uuidv4();
        const email = profile.email ?? `naver_${profile.id}@example.com`;
        await this.knex<User>('users').insert({
          id: userId,
          email,
          social_provider: 'naver',
          social_id: String(profile.id),
          phone: phone || null,
          points: 0,
          push_notification_enabled: true,
          created_at: new Date(),
          updated_at: new Date(),
        });
        user = await this.knex<User>('users').where({ id: userId }).first();
      } else if (phone && !user.phone) {
        await this.knex<User>('users')
          .where({ id: user.id })
          .update({ phone, updated_at: new Date() });
      }

      // 5. 토큰 생성
      const { accessToken, refreshToken } = await this.generateTokens({
        id: user!.id,
        email: user!.email,
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/api/auth/user',
      });

      this.logger.verbose(`Naver login successful for user ${user!.id}`);
      return { accessToken };
    } catch (error) {
      this.logger.error(`Naver login error: ${error.message}`, error.stack);
      throw error;
    }
  }

  // 로그아웃
  async logout(
    user: { id: string; email: string },
    res: Response,
  ): Promise<void> {
    try {
      await this.redisService.delete(`refreshToken:${user.id}`);
      res.clearCookie('refreshToken', {
        path: '/api/auth/user',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });
      this.logger.verbose(`Logout successful for user ${user.id}`);
    } catch (error) {
      this.logger.error(
        `Logout error for user ${user.id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // 토큰 갱신
  async refreshAccessToken(
    body: RefreshTokenDto,
    req: Request,
    res: Response,
  ): Promise<{ accessToken: string }> {
    try {
      const refreshToken = req.cookies?.refreshToken ?? body.refreshToken;
      if (!refreshToken) {
        this.logger.warn(`No refresh token provided`);
        throw new UnauthorizedException('리프레시 토큰이 없습니다.');
      }

      const decoded = this.verifyToken(refreshToken);
      const storedToken = await this.redisService.get(
        `refreshToken:${decoded.id}`,
      );
      if (!storedToken || storedToken !== refreshToken) {
        this.logger.warn(`Invalid refresh token for user ${decoded.id}`);
        throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다.');
      }

      const user = await this.knex<User>('users')
        .where({ id: decoded.id, revoked_at: null })
        .first();
      if (!user) {
        this.logger.warn(`User ${decoded.id} not found or revoked`);
        throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
      }

      await this.redisService.delete(`refreshToken:${decoded.id}`);
      const { accessToken, refreshToken: newRefreshToken } =
        await this.generateTokens({
          id: user.id,
          email: user.email,
        });

      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/api/auth/user',
      });

      this.logger.verbose(`Token refreshed for user ${user.id}`);
      return { accessToken };
    } catch (error) {
      this.logger.error(`Token refresh error: ${error.message}`, error.stack);
      throw error;
    }
  }

  // 이메일 중복 체크
  async checkEmail(email: string): Promise<void> {
    const user = await this.knex<User>('users').where({ email }).first();
    if (user) {
      this.logger.warn(`Email ${email} already exists`);
      throw new ConflictException('이미 등록된 이메일입니다.');
    }
  }

  // 전화번호 중복 체크
  async checkPhone(phone: string): Promise<void> {
    const normalized = phone.replace(/\D/g, '');
    const user = await this.knex<User>('users')
      .whereRaw("REPLACE(phone, '-', '') = ?", [normalized])
      .first();
    if (user) {
      this.logger.warn(`Phone ${phone} already exists`);
      throw new ConflictException('이미 등록된 전화번호입니다.');
    }
  }

  // 비밀번호 찾기
  // async forgotPassword(email: string): Promise<void> {
  //   try {
  //     const user = await this.knex<User>('users')
  //       .where({ email, revoked_at: null })
  //       .first();
  //     if (!user) {
  //       this.logger.warn(`Forgot password failed: email ${email} not found`);
  //       throw new UnauthorizedException('등록된 이메일이 아닙니다.');
  //     }
  //
  //     const token = await this.jwtService.signAsync(
  //       { id: user.id, email: user.email, purpose: 'password_reset' },
  //       { secret: jwtConstants.secret, expiresIn: '1h' },
  //     );
  //
  //     const { subject, content } = createPasswordResetContent(token);
  //     await sendEmail(user.email, subject, content);
  //     this.logger.verbose(`Password reset email sent to ${user.email}`);
  //   } catch (error) {
  //     this.logger.error(
  //       `Forgot password error for email ${email}: ${error.message}`,
  //       error.stack,
  //     );
  //     throw error;
  //   }
  // }

  // 비밀번호 초기화
  async resetPassword(token: string, password: string): Promise<void> {
    try {
      const decoded = await this.jwtService.verifyAsync(token, {
        secret: jwtConstants.secret,
      });

      if (decoded.purpose !== 'password_reset') {
        this.logger.warn(`Invalid token purpose for password reset`);
        throw new UnauthorizedException('유효하지 않은 토큰입니다.');
      }

      const user = await this.knex<User>('users')
        .where({ id: decoded.id, revoked_at: null })
        .first();
      if (!user) {
        this.logger.warn(`User ${decoded.id} not found or revoked`);
        throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
      }

      const hashedPassword = await this.hashPassword(password);
      await this.knex<User>('users')
        .where({ id: user.id })
        .update({ password: hashedPassword, updated_at: new Date() });

      this.logger.verbose(`Password reset successful for user ${user.id}`);
    } catch (error) {
      this.logger.error(`Password reset error: ${error.message}`, error.stack);
      throw new UnauthorizedException('비밀번호 재설정 실패');
    }
  }

  // 비밀번호 해시
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  // 비밀번호 검증
  private async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  // 토큰 생성
  private async generateTokens(payload: {
    id: string;
    email: string;
  }): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const accessToken = this.jwtService.sign(payload, {
        secret: jwtConstants.secret,
        expiresIn: '1h',
      });
      const refreshToken = this.jwtService.sign(payload, {
        secret: jwtConstants.secret,
        expiresIn: '7d',
      });

      await this.redisService.set(
        `refreshToken:${payload.id}`,
        refreshToken,
        7 * 24 * 60 * 60,
      );
      this.logger.verbose(`Tokens generated for user ${payload.id}`);
      return { accessToken, refreshToken };
    } catch (error) {
      this.logger.error(
        `Token generation error for user ${payload.id}: ${error.message}`,
        error.stack,
      );
      throw new UnauthorizedException('토큰 생성 실패');
    }
  }

  // 토큰 검증
  private verifyToken(token: string): any {
    try {
      return this.jwtService.verify(token, { secret: jwtConstants.secret });
    } catch (error) {
      this.logger.error(`Token verification failed: ${error.message}`);
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }
  }
}
