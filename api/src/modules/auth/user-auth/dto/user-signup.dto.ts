import { z } from 'zod';

export const UserSignupSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요.'),
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다.'),
  phone: z
    .string()
    .regex(/^\d{10,11}$/, '유효한 전화번호를 입력해주세요.')
    .optional(),
});

export class UserSignupDto {
  email: string;
  password: string;
  phone?: string;

  static schema = UserSignupSchema;
}
