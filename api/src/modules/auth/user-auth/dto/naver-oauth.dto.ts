import { z } from 'zod';

export const NaverOAuthSchema = z.object({
  code: z.string().min(1, '네이버 인증 코드를 입력해주세요.'),
  state: z.string().min(1, '네이버 state 값을 입력해주세요.'),
});

export class NaverOAuthDto {
  code: string;
  state: string;

  static schema = NaverOAuthSchema;
}
