import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import dayjs from "dayjs";
import { Repository } from "typeorm";
import { Users } from "src/entities/share/users.entity";
import { USER_TYPE } from "src/consts/user.const";
import { AuthService } from "../auth.service";

import { SharesModule } from "../../shares/shares.module";
import { DmpJwtService } from "../../shares/jwt/jwt.service";

describe("AuthService", () => {
  let service: AuthService;
  let jwtService: DmpJwtService;
  /* eslint-disable */
  let usersRepository: Repository<Users>;
  /* eslint-disable */

  const loginId = "user123";
  const password = "password123";
  let user: Users;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [SharesModule],
      providers: [
        DmpJwtService,
        AuthService,
        {
          provide: getRepositoryToken(Users),
          useFactory: () => ({
            findOne: jest.fn(),
          }),
        },
      ],
    }).compile();

    service = module.get(AuthService);
    jwtService = module.get(DmpJwtService);
    usersRepository = module.get(getRepositoryToken(Users));

    // テスト用UserEntity作成
    user = new Users();
    user.id = 1123;
    user.loginId = loginId;
    user.password = password;
    user.userType = USER_TYPE.NORMAL;
    user.expireDate = dayjs(Date.now()).format("YYYY-MM-DD");
  });

  describe("createTokenByUser", () => {
    it("引数のユーザー情報を元にJWTが作成され返却されること", async () => {
      const token = await service.createTokenByUser(user);
      const decoded = await jwtService.verifyAsync(token);

      expect(decoded).toMatchObject({ id: user.id, loginId: user.loginId, userType: user.userType });
    });
  });
});
