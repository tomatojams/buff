import { z } from 'zod';

export const UserSigninSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요.'),
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다.'),
});

export class UserSigninDto {
  email: string;
  password: string;

  static schema = UserSigninSchema;
}
