import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { Users } from "src/entities/share/users.entity";

@Injectable()
export class UserService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  /**
   * ログインIDとパスワードを使用し、Token(JWT)を発行
   *
   * 　・成功時はJWTを返却します。
   * 　・パスワード不備や有効期限切れの場合もユーザーが存在しない扱いとします。
   *
   * @param {string} loginId
   * @param {string} password
   * @returns User
   */
  async findUserByLoginIdAndPassword(loginId: string, password: string): Promise<Users | null> {
    const user = await this.dataSource.manager.findOne(Users, {
      where: { loginId },
      select: ["id", "loginId", "_password", "userType", "expireDate"],
    });

    if (user && user.isExpired !== true && user.isSamePassword(password)) {
      delete user._password;
      return user;
    }

    return null;
  }

  /**
   * ユーザーIDとログインIDを元に、ユーザー情報を1件取得
   *
   * @param id
   * @param loginId
   * @returns
   */
  async findOneByIdAndLoginId(id: number, loginId: string): Promise<Users> {
    return await this.dataSource.manager.findOne(Users, { where: { id, loginId } });
  }
}
