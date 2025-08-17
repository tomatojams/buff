import { ApiPropertyOptional } from "@nestjs/swagger";
import { z } from "zod";
import { MAX_CONTENT_DIFF } from "src/common/constants/constants";

export class PaginatedZodDto {
  @ApiPropertyOptional({
    description: "건너뛸 레코드 수 (offset)",
    default: 0,
    example: 0,
  })
  offset: number;

  @ApiPropertyOptional({
    description: "반환할 최대 레코드 수 (limit)",
    default: 10,
    example: 10,
  })
  limit: number;

  @ApiPropertyOptional({
    description: "정렬 순서 (sortOrder) - asc 또는 desc",
    default: "desc",
    example: "asc",
    enum: ["asc", "desc"], // ← enum 옵션 추가
    enumName: "SortOrderEnum", // ← Swagger 문서에 표시될 enum 이름
  })
  sortOrder: "asc" | "desc";

  /** Zod 스키마 정의 */
  static schema = z
    .object({
      offset: z.coerce.number().int().min(0).default(0),
      limit: z.coerce.number().int().min(1).default(10),
      sortOrder: z.enum(["asc", "desc"]).default("desc"),
    })
    .refine((data) => data.limit - data.offset <= MAX_CONTENT_DIFF, {
      message: `limit과 offset의 차이는 ${MAX_CONTENT_DIFF} 이하여야 합니다.`,
      path: ["limit"],
    });
}
