import { Module } from "@nestjs/common";
import { LoggerModule as PinoLoggerModule } from "nestjs-pino";
import { LoggerService } from "./logger.service";
import { APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";
import { LoggerInterceptor } from "./logger.interceptor";
import dayjs from "dayjs";
import { LoggerExceptionFilter } from "./logger-exception.filter";

@Module({
  imports: [
    PinoLoggerModule.forRoot({
      pinoHttp: {
        timestamp: () => `,"timestamp":"${dayjs().toISOString()}"`,
        autoLogging: false,
        // null設定で、デフォルトで用意しているhostname,pidを除外
        base: null,
        serializers: {
          req() {},
          res() {},
        },
        customProps: (req: any) => {
          return { url: req.url, method: req.method, query: req.query, body: { ...req.body, password: req.body.password && "" } };
        },
        formatters: {
          // レベルを"info", "error"表示へ
          level: (label) => {
            return { level: label };
          },
        },
      },
    }),
  ],
  providers: [
    LoggerService,
    { provide: APP_INTERCEPTOR, useClass: LoggerInterceptor },
    { provide: APP_FILTER, useClass: LoggerExceptionFilter },
  ],
  exports: [LoggerService],
})
export class LoggerModule {}
