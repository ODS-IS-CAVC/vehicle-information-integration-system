import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import { LoggerService } from "./logger.service";
import { HttpAdapterHost } from "@nestjs/core";

@Catch()
export class LoggerExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly logger: LoggerService,
  ) {}

  catch(exception: any, host: ArgumentsHost) {
    const { httpAdapter } = this.httpAdapterHost;

    const statusCode = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const req = host.switchToHttp().getRequest();

    // バリデーションエラー時のエラーログ出力
    if (statusCode === HttpStatus.BAD_REQUEST) {
      this.logger.validationError({
        statusCode: statusCode,
        message: exception.response.message,
        stack: exception.stack,
      });
    }

    // エラー発生時のアクセスログ出力
    this.logger.accessLogFailed({
      statusCode: statusCode,
      userId: req.user?.loginId || "",
      sourceIp: req.ip,
    });

    // レスポンス内容をクライアントへ返却
    httpAdapter.reply(host.switchToHttp().getResponse(), exception.response || "", exception.response?.statusCode);
  }
}
