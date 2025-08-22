export interface UserModel {
  id: string; // UUID, Primary Key
  email: string; // 고유한 이메일
  password?: string; // 선택적, NULL 허용
  socialProvider?: SocialProvider; // 소셜 로그인 제공자, NULL 허용
  socialId?: string; // 소셜 로그인 ID, NULL 허용
  phone?: string; // 전화번호, NULL 허용
  points: number; // 포인트, 기본값 0.00
  pushNotificationEnabled: boolean; // 푸시 알림 활성화 여부, 기본값 true
  role: Role; // 역할, 기본값 'user'
  createdAt: Date; // 생성 시간
  updatedAt: Date; // 업데이트 시간
  revokedAt?: Date; // 삭제 시간, NULL 허용
}

export enum SocialProvider {
  KAKAO = 'kakao',
  NAVER = 'naver',
  APPLE = 'apple',
}

export enum Role {
  ADMIN = 'admin',
  USER = 'user',
  ANY = 'any',
  PARTNER = 'partner',
}
