import { PipeTransform, Injectable, BadRequestException } from "@nestjs/common";
import { ObjectSchema } from "joi";

/**
 * JoiValidationPipe 클래스
 * 요청 데이터를 Joi 스키마를 사용해 검증하는 커스텀 파이프입니다.
 */
@Injectable()
export class JoiValidationPipe implements PipeTransform {
  constructor(private schema: ObjectSchema) {}

  /**
   * 입력 데이터를 Joi 스키마로 검증하며, 실패할 경우 BadRequestException을 발생시킵니다.
   * @param value 검증할 데이터
   * @returns 유효한 데이터 (타입 변환 포함)
   */
  transform(value: any) {
    const { error, value: validatedValue } = this.schema.validate(value, {
      abortEarly: false, // 모든 검증 에러를 수집합니다.
      allowUnknown: false, // 스키마에 정의되지 않은 속성을 허용하지 않습니다.
      convert: true, // 자동 타입 변환 multer 사용시 필요함
    });

    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join(", ");
      throw new BadRequestException(errorMessage);
    }
    return validatedValue;
  }
}
