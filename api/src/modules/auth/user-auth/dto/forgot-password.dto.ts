import { z } from 'zod';

export const ForgotPasswordSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요.'),
});

export class ForgotPasswordDto {
  email: string;

  static schema = ForgotPasswordSchema;
}
