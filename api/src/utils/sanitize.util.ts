import * as sanitizeHtml from "sanitize-html";

// Sanitization 설정 타입
interface SanitizeConfig {
  allowedTags?: string[];
  allowedAttributes?: Record<string, string[]>;
}

// 필드별 Sanitization 설정
interface FieldSanitizeConfig {
  [field: string]: SanitizeConfig;
}

// 기본 설정: 모든 HTML 태그와 속성을 불허
const strictSanitizeConfig: SanitizeConfig = {
  allowedTags: [],
  allowedAttributes: {},
};

// 범용 Sanitization 함수
export function sanitizeInput<T extends Record<string, any>>(
  input: T,
  fieldConfigs: FieldSanitizeConfig = {}
): T {
  const sanitized: Partial<T> = {};

  for (const key in input) {
    const value = input[key];
    // 필드별 설정이 있으면 사용, 없으면 엄격한 기본 설정 적용
    const config = fieldConfigs[key] || strictSanitizeConfig;

    // 값이 문자열이거나 옵셔널 문자열일 경우에만 sanitization
    if (typeof value === "string") {
      sanitized[key] = sanitizeHtml(value, config) as T[typeof key];
    } else {
      sanitized[key] = value; // 문자열이 아니면 그대로 유지
    }
  }

  return sanitized as T;
}

// CreateAdminInquiryInput용 기본 설정 (모든 필드에 엄격한 규칙 적용)
export const adminInquirySanitizeConfig: FieldSanitizeConfig = {
  name: strictSanitizeConfig,
  contact: strictSanitizeConfig,
  subject: strictSanitizeConfig,
  content: strictSanitizeConfig,
};

// CreatePaymentZodDto용 설정 (사용자 입력 필드만 sanitization)
export const paymentSanitizeConfig: FieldSanitizeConfig = {
  reservation_name: strictSanitizeConfig,
  payer_name: strictSanitizeConfig,
  phone_number: strictSanitizeConfig,
  request_message: strictSanitizeConfig,
};
