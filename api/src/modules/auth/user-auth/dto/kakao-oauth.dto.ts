import { z } from 'zod';

export const KakaoOAuthSchema = z.object({
  code: z.string().min(1, '카카오 인증 코드를 입력해주세요.'),
  redirectUri: z.string().url('유효한 리다이렉트 URL을 입력해주세요.'),
});

export class KakaoOAuthDto {
  code: string;
  redirectUri: string;

  static schema = KakaoOAuthSchema;
}
