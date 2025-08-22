// partner-auth.service.ts
import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Knex } from 'knex';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from 'src/common/redis.service';
import {
  PartnerSignupDto,
  PartnerSigninDto,
  RefreshTokenDto,
} from './dto/partner-auth.dto';
import { Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { jwtConstants } from 'src/common/constants/constants';

interface Partner {
  id: string;
  email: string;
  password: string;
  phone_number: string;
  name: string;
  business_registration_number: string;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  created_at: Date;
  updated_at: Date;
  revoked_at: Date | null;
}

@Injectable()
export class PartnerAuthService {
  private readonly logger = new Logger(PartnerAuthService.name);

  constructor(
    @Inject('KNEX_CONNECTION') private readonly knex: Knex,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {}

  // 회원가입
  async signup(signupDto: PartnerSignupDto): Promise<{ id: string }> {
    try {
      const {
        email,
        password,
        phone_number,
        name,
        business_registration_number,
      } = signupDto;

      // 이메일, 전화번호, 사업자등록번호 중복 체크
      await this.checkEmail(email);
      await this.checkPhone(phone_number);
      await this.checkBusinessRegistrationNumber(business_registration_number);

      const hashedPassword = await this.hashPassword(password);
      const partnerId = uuidv4();

      await this.knex<Partner>('partners').insert({
        id: partnerId,
        email,
        password: hashedPassword,
        phone_number,
        name,
        business_registration_number,
        status: 'pending',
        created_at: new Date(),
        updated_at: new Date(),
      });

      this.logger.verbose(`Partner created: ${email}`);
      return { id: partnerId };
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
    signInDto: PartnerSigninDto,
    res: Response,
  ): Promise<{ accessToken: string; email: string }> {
    try {
      const { email, password } = signInDto;
      const partner = await this.knex<Partner>('partners')
        .where({ email, revoked_at: null })
        .first();

      if (!partner) {
        this.logger.warn(`Login failed: email ${email} not found`);
        throw new UnauthorizedException(
          '이메일 또는 비밀번호가 잘못되었습니다.',
        );
      }

      const isPasswordValid = await this.validatePassword(
        password,
        partner.password,
      );
      if (!isPasswordValid) {
        this.logger.warn(`Invalid password attempt for partner ${partner.id}`);
        throw new UnauthorizedException(
          '이메일 또는 비밀번호가 잘못되었습니다.',
        );
      }

      const { accessToken, refreshToken } = await this.generateTokens({
        id: partner.id,
        email: partner.email,
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/api/partner-auth',
      });

      this.logger.verbose(`Login successful for partner ${partner.id}`);
      return { accessToken, email: partner.email };
    } catch (error) {
      this.logger.error(
        `Login error for email ${signInDto.email}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // 로그아웃
  async logout(
    partner: { id: string; email: string },
    res: Response,
  ): Promise<void> {
    try {
      await this.redisService.delete(`refreshToken:${partner.id}`);
      res.clearCookie('refreshToken', {
        path: '/api/partner-auth',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });
      this.logger.verbose(`Logout successful for partner ${partner.id}`);
    } catch (error) {
      this.logger.error(
        `Logout error for partner ${partner.id}: ${error.message}`,
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
        this.logger.warn(`Invalid refresh token for partner ${decoded.id}`);
        throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다.');
      }

      const partner = await this.knex<Partner>('partners')
        .where({ id: decoded.id, revoked_at: null })
        .first();
      if (!partner) {
        this.logger.warn(`Partner ${decoded.id} not found or revoked`);
        throw new UnauthorizedException('파트너를 찾을 수 없습니다.');
      }

      await this.redisService.delete(`refreshToken:${decoded.id}`);
      const { accessToken, refreshToken: newRefreshToken } =
        await this.generateTokens({
          id: partner.id,
          email: partner.email,
        });

      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/api/partner-auth',
      });

      this.logger.verbose(`Token refreshed for partner ${partner.id}`);
      return { accessToken };
    } catch (error) {
      this.logger.error(`Token refresh error: ${error.message}`, error.stack);
      throw error;
    }
  }

  // 이메일 중복 체크
  async checkEmail(email: string): Promise<void> {
    const partner = await this.knex<Partner>('partners')
      .where({ email })
      .first();
    if (partner) {
      this.logger.warn(`Email ${email} already exists`);
      throw new ConflictException('이미 등록된 이메일입니다.');
    }
  }

  // 전화번호 중복 체크
  async checkPhone(phone_number: string): Promise<void> {
    const normalized = phone_number.replace(/\D/g, '');
    const partner = await this.knex<Partner>('partners')
      .whereRaw("REPLACE(phone_number, '-', '') = ?", [normalized])
      .first();
    if (partner) {
      this.logger.warn(`Phone ${phone_number} already exists`);
      throw new ConflictException('이미 등록된 전화번호입니다.');
    }
  }

  // 사업자등록번호 중복 체크
  async checkBusinessRegistrationNumber(
    business_registration_number: string,
  ): Promise<void> {
    const partner = await this.knex<Partner>('partners')
      .where({ business_registration_number })
      .first();
    if (partner) {
      this.logger.warn(
        `Business registration number ${business_registration_number} already exists`,
      );
      throw new ConflictException('이미 등록된 사업자등록번호입니다.');
    }
  }

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

      const partner = await this.knex<Partner>('partners')
        .where({ id: decoded.id, revoked_at: null })
        .first();
      if (!partner) {
        this.logger.warn(`Partner ${decoded.id} not found or revoked`);
        throw new UnauthorizedException('파트너를 찾을 수 없습니다.');
      }

      const hashedPassword = await this.hashPassword(password);
      await this.knex<Partner>('partners')
        .where({ id: partner.id })
        .update({ password: hashedPassword, updated_at: new Date() });

      this.logger.verbose(
        `Password reset successful for partner ${partner.id}`,
      );
    } catch (error) {
      this.logger.error(`Password reset error: ${error.message}`, error.stack);
      throw new UnauthorizedException('비밀번호 재설정 실패');
    }
  }

  // 파트너 정보 조회
  async me(
    partner: Omit<Partner, 'password'>,
  ): Promise<Omit<Partner, 'password'>> {
    try {
      const partnerData = await this.knex<Partner>('partners')
        .select(
          'id',
          'email',
          'phone_number',
          'name',
          'business_registration_number',
          'status',
          'created_at',
          'updated_at',
          'revoked_at',
        )
        .where({ id: partner.id, revoked_at: null })
        .first();

      if (!partnerData) {
        this.logger.warn(`Partner ${partner.id} not found or revoked`);
        throw new UnauthorizedException('파트너를 찾을 수 없습니다.');
      }

      this.logger.verbose(`Partner info retrieved for partner ${partner.id}`);
      return partnerData;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve partner info for ${partner.id}: ${error.message}`,
        error.stack,
      );
      throw error;
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
      this.logger.verbose(`Tokens generated for partner ${payload.id}`);
      return { accessToken, refreshToken };
    } catch (error) {
      this.logger.error(
        `Token generation error for partner ${payload.id}: ${error.message}`,
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
