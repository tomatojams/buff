import { z } from 'zod';

export const CheckEmailSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요.'),
});

export class CheckEmailDto {
  email: string;

  static schema = CheckEmailSchema;
}
