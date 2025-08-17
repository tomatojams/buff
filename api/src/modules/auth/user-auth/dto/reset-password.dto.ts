import { z } from 'zod';

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, '유효한 토큰을 입력해주세요.'),
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다.'),
});

export class ResetPasswordDto {
  token: string;
  password: string;

  static schema = ResetPasswordSchema;
}
