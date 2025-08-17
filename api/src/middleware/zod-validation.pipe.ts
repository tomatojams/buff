// src/common/zod-validation.pipe.ts
import { PipeTransform, Injectable, BadRequestException } from "@nestjs/common";
import { ZodError, ZodSchema } from "zod";

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema<any>) {}

  transform(value: any) {
    try {
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          path: err.path.join("."),
          message: err.message,
        }));
        throw new BadRequestException({ message: "Validation failed", errors });
      }
      throw new BadRequestException("Validation failed");
    }
  }
}
