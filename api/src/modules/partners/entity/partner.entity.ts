// src/modules/partners/entity/partner.entity.ts
export interface PartnerModel {
  id: string; // UUID, Primary Key
  email: string; // 고유한 이메일
  password: string; // 필수, NOT NULL
  phone_number: string; // 고유한 전화번호
  name: string; // 파트너 이름
  business_registration_number: string; // 고유한 사업자등록번호
  status: 'active' | 'inactive' | 'pending' | 'suspended'; // 상태, 기본값 'pending'
  created_at: Date; // 생성 시간
  updated_at: Date; // 업데이트 시간
  revoked_at?: Date; // 삭제 시간, NULL 허용
}
