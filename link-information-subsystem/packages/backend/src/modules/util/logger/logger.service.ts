import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class LoggerService {
  private readonly logger = new Logger(LoggerService.name);

  error(error: Error) {
    const { message, stack } = error;
    this.logger.error({ message, stack });
  }

  accessLogSuccess(data: { statusCode: number; userId: string; sourceIp: string }) {
    this.logger.log(data);
  }

  accessLogFailed(data: { statusCode: number; userId: string; sourceIp: string }) {
    this.logger.error(data);
  }

  loginLog(data: { userId: string; doLogin: boolean; sourceIp: string }) {
    this.logger.log(data);
  }

  validationError(data: { statusCode: number; message: string; stack: string }) {
    this.logger.error(data);
  }
}
