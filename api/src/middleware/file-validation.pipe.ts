import { PipeTransform, Injectable, BadRequestException } from "@nestjs/common";
import { Express } from "express";
import { extname } from "path";

export interface FileValidationOptions {
  fileType?: RegExp;
  maxSize?: number;
}

@Injectable()
export class FileValidationPipe implements PipeTransform {
  constructor(private readonly options: FileValidationOptions) {}

  transform(files: Express.Multer.File[] | Record<string, Express.Multer.File[]>) {
    // 1) 실제 Multer.File 객체만 걸러내어 배열로 재구성
    const arr: Express.Multer.File[] = [];
    if (Array.isArray(files)) {
      for (const f of files) {
        if (this.isRealFile(f)) arr.push(f);
      }
    } else if (files && typeof files === "object") {
      for (const val of Object.values(files)) {
        if (Array.isArray(val)) {
          for (const f of val) {
            if (this.isRealFile(f)) arr.push(f);
          }
        }
      }
    }

    // 2) 재구성된 배열에 대해서만 검사 수행
    for (const file of arr) {
      // 2-1) MIME 타입 검증
      if (this.options.fileType && !this.options.fileType.test(file.mimetype)) {
        const ext = extname(file.originalname).toLowerCase();
        if (!this.options.fileType.test(ext)) {
          throw new BadRequestException(`잘못된 파일 형식: ${file.originalname}`);
        }
      }
      // 2-2) 파일 크기 검증
      if (this.options.maxSize != null && file.size > this.options.maxSize) {
        throw new BadRequestException(
          `파일 크기 초과: ${file.originalname} (${file.size} bytes, 최대 ${this.options.maxSize} bytes)`
        );
      }
    }

    return files;
  }

  /** 실제 업로드된 Multer.File 객체인지 확인 */
  private isRealFile(f: any): f is Express.Multer.File {
    return (
      f && typeof f === "object" && typeof f.originalname === "string" && Buffer.isBuffer((f as any).buffer)
    );
  }
}
