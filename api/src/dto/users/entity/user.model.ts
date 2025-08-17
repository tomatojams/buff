import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export interface UserModel {
  id: string; // UUID, Primary Key
  email: string; // Unique, Not Null
  password?: string; // Nullable
  social_provider?: 'kakao' | 'naver' | 'apple'; // Nullable
  social_id?: string; // Nullable
  phone?: string; // Unique, Nullable
  points: number; // Default 0.00
  push_notification_enabled: boolean; // Default true
  created_at: Date; // Not Null
  updated_at: Date; // Not Null
  revoked_at?: Date; // Nullable
}

export const UserModelSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  password: z.string().optional(),
  social_provider: z.enum(['kakao', 'naver', 'apple']).optional(),
  social_id: z.string().optional(),
  phone: z.string().optional(),
  points: z.number().min(0),
  push_notification_enabled: z.boolean(),
  created_at: z.date(),
  updated_at: z.date(),
  revoked_at: z.date().optional(),
}).strict();