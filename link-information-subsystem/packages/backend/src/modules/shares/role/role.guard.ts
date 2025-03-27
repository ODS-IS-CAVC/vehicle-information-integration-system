import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException, UseGuards, applyDecorators } from "@nestjs/common";
import { API_KEY, NOT_VERIFIED_IP, Role, VERIFIED_TOKEN_URL } from "../../../consts/role.const";
import { HttpService } from "@nestjs/axios";
import { lastValueFrom, map } from "rxjs";
import { LoggerService } from "src/modules/util/logger/logger.service";

export const Roles = (...roles: Role[]) => {
  const httpService = new HttpService();
  let loggerService;
  return applyDecorators(UseGuards(new RoleGuard(roles, httpService, loggerService)));
};

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private readonly roles: Role[],
    private readonly httpService: HttpService,
    private readonly loggerService: LoggerService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!this.roles || this.roles.length === 0) {
      this.loggerService.error(new UnauthorizedException());
      throw new UnauthorizedException();
    }

    const req = context.switchToHttp().getRequest();

    const user = req.user || null;

    const ip = req.ip ? req.ip.replace("::ffff:", "") : "";

    Logger.log(ip);

    // 特定のIPからのアクセスは認証無しで通過
    if (NOT_VERIFIED_IP().includes(ip)) {
      Logger.log("認証無しで実行可能なIPからのアクセス");
      return true;
    }

    if (!user || user.isExpired) {
      try {
        Logger.log("自前の認証に失敗");
        // こちらの認証に失敗した場合、NTTデータ側のトークン認証を呼び出す。
        const { authorization } = req.headers;

        const url = VERIFIED_TOKEN_URL();
        const headers = {
          "Content-Type": "application/json",
          apiKey: API_KEY(),
        };
        const body = {
          idToken: authorization.replace("Bearer ", ""),
        };
        const result = await lastValueFrom(this.httpService.post(url, body, { headers: headers }).pipe(map((res) => res.data)));
        // トークンが有効ならば認証はOKとする。
        if (result.active) {
          Logger.log("NTT側の認証に成功");
          return true;
        } else {
          Logger.log("両方の認証に失敗");
          throw new UnauthorizedException();
        }
      } catch (error) {
        Logger.log("認証に失敗");
        Logger.log(error);
        throw new UnauthorizedException();
      }
    }

    return true;
  }
}
