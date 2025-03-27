import { Injectable } from "@nestjs/common";
import { DmpJwtService } from "../shares/jwt/jwt.service";
import { Users } from "src/entities/share/users.entity";

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: DmpJwtService) {}

  /**
   * ユーザー情報からToken(JWT)を作成して返却
   *
   * @param user
   * @returns
   */
  async createTokenByUser(user: Users): Promise<string> {
    return await this.jwtService.signAsync({ id: user.id, loginId: user.loginId, userType: user.userType });
  }
}
