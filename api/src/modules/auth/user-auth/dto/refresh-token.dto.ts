import { z } from 'zod';

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().optional(),
});

export class RefreshTokenDto {
  refreshToken?: string;

  static schema = RefreshTokenSchema;
}
