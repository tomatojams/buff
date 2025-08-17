import { z } from 'zod';

export const CheckPhoneSchema = z.object({
  phone: z.string().regex(/^\d{10,11}$/, '유효한 전화번호를 입력해주세요.'),
});

export class CheckPhoneDto {
  phone: string;

  static schema = CheckPhoneSchema;
}
