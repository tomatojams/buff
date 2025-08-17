import { CallHandler, ExecutionContext, Injectable, NestInterceptor, Logger } from "@nestjs/common";
import { Observable, tap } from "rxjs";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // 요청 정보 추출
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;

    // 요청 시점 로깅
    this.logger.log(`Incoming Request: [${method}] ${url}`);

    // 요청 처리 시작 시각 기록
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        // 응답 후 소요 시간 계산 및 로깅
        const delay = Date.now() - now;
        this.logger.log(`Outgoing Response: [${method}] ${url} (${delay}ms)`);
      })
    );
  }
}
