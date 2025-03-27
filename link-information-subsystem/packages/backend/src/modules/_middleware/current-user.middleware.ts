import { Injectable, InternalServerErrorException, Logger, NestMiddleware } from "@nestjs/common";
import { DmpJwtService } from "../shares/jwt/jwt.service";
import { UserService } from "../user/user.service";

@Injectable()
export class CurrentUserMiddleware implements NestMiddleware {
  constructor(
    private readonly service: UserService,
    private readonly jwtService: DmpJwtService,
  ) {}

  async use(req: any, _: any, next: () => void): Promise<void> {
    const { authorization } = req.headers;
    if (!authorization || !authorization.startsWith("Bearer ")) {
      next();
      return;
    }

    let data;
    try {
      data = await this.jwtService.verifyAsync(authorization.replace("Bearer ", ""));
    } catch (e) {}

    try {
      if (data?.id) {
        const user = await this.service.findOneByIdAndLoginId(data.id, data.loginId);
        if (user) {
          req.user = user;
        }
      }
    } catch (e) {
      Logger.log("CurrentUserMiddleware");
      throw new InternalServerErrorException();
    }

    next();
  }
}
