import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { tap } from "rxjs";
import { LoggerService } from "./logger.service";

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  constructor(private readonly loggerService: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler<any>) {
    return next.handle().pipe(
      tap(() => {
        const req = context.switchToHttp().getRequest();
        const res = context.switchToHttp().getResponse();

        this.loggerService.accessLogSuccess({
          statusCode: res.statusCode,
          userId: req.user?.loginId || "",
          sourceIp: req.ip,
        });
      }),
    );
  }
}
