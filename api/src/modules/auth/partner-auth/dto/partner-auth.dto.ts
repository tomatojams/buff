// partner-auth.dto.ts
import { z } from 'zod';

// 회원가입 DTO
export class PartnerSignupDto {
  static schema = z.object({
    email: z.string().email('유효한 이메일을 입력하세요.'),
    password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다.'),
    phone_number: z
      .string()
      .regex(/^\d{10,11}$/, '유효한 전화번호를 입력하세요.'),
    name: z.string().min(1, '이름을 입력하세요.'),
    business_registration_number: z
      .string()
      .regex(/^\d{10}$/, '유효한 사업자등록번호를 입력하세요.'),
  });

  email: string;
  password: string;
  phone_number: string;
  name: string;
  business_registration_number: string;
}

// 로그인 DTO
export class PartnerSigninDto {
  static schema = z.object({
    email: z.string().email('유효한 이메일을 입력하세요.'),
    password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다.'),
  });

  email: string;
  password: string;
}

// 이메일 중복 체크 DTO
export class CheckEmailDto {
  static schema = z.object({
    email: z.string().email('유효한 이메일을 입력하세요.'),
  });

  email: string;
}

// 전화번호 중복 체크 DTO
export class CheckPhoneDto {
  static schema = z.object({
    phone_number: z
      .string()
      .regex(/^\d{10,11}$/, '유효한 전화번호를 입력하세요.'),
  });

  phone_number: string;
}

// 리프레시 토큰 DTO
export class RefreshTokenDto {
  static schema = z.object({
    refreshToken: z.string().min(1, '리프레시 토큰이 필요합니다.'),
  });

  refreshToken: string;
}

// 비밀번호 초기화 DTO
export class ResetPasswordDto {
  static schema = z.object({
    token: z.string().min(1, '토큰이 필요합니다.'),
    password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다.'),
  });

  token: string;
  password: string;
}
