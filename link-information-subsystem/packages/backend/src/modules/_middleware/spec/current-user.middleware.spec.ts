import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import dayjs from "dayjs";
import { SharesModule } from "../../shares/shares.module";
import { Users } from "src/entities/share/users.entity";
import { USER_TYPE } from "src/consts/user.const";
import { UserService } from "../../user/user.service";
import { CurrentUserMiddleware } from "../current-user.middleware";
import { DmpJwtService } from "../../shares/jwt/jwt.service";
import { DataSource } from "typeorm";

describe("AuthService", () => {
  let middleware: CurrentUserMiddleware;
  let userService: UserService;
  let jwtService: DmpJwtService;
  const mockDataSource = jest.mocked(DataSource);

  const loginId = "user123";
  const password = "password123";
  let user: Users;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [SharesModule],
      providers: [
        DmpJwtService,
        UserService,
        {
          provide: getRepositoryToken(Users),
          useFactory: () => ({
            findOne: jest.fn(),
          }),
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    userService = module.get(UserService);
    jwtService = module.get(DmpJwtService);

    middleware = new CurrentUserMiddleware(userService, jwtService);

    // テスト用UserEntity作成
    user = new Users();
    user.id = 1123;
    user.loginId = loginId;
    user.password = password;
    user.userType = USER_TYPE.NORMAL;
    user.expireDate = dayjs(Date.now()).format("YYYY-MM-DD");
  });

  describe("use", () => {
    let token = "";
    /* eslint-disable */
    let spyVerifyToken: jest.SpyInstance;
    /* eslint-disable */
    let spyFindUser: jest.SpyInstance;

    beforeEach(async () => {
      token = await jwtService.signAsync({ ...user }, { expiresIn: "2s" });

      spyVerifyToken = jest.spyOn(jwtService, "verifyAsync");
      spyFindUser = jest.spyOn(userService, "findOneByIdAndLoginId").mockResolvedValue(user);
    });

    it("authorizationが空の場合、request.userに操作ユーザーが格納されないこと", async () => {
      const req: any = { headers: { authorization: "" } };
      await middleware.use(req, {}, jest.fn());

      expect(req.user).toBeUndefined();
    });

    describe("authorizationが存在", () => {
      it("Bearerがついてない場合、request.userに操作ユーザーが格納されないこと", async () => {
        const req: any = { headers: { authorization: "aaaaaaaa" } };
        await middleware.use(req, {}, jest.fn());

        expect(req.user).toBeUndefined();
      });

      it("トークンが復号できない場合、request.userに操作ユーザーが格納されないこと", async () => {
        const req: any = { headers: { authorization: "Bearer aaaaaaaa" } };
        await middleware.use(req, {}, jest.fn());

        expect(req.user).toBeUndefined();
      });

      it("トークンが有効期限切れの場合、request.userに操作ユーザーが格納されないこと", async () => {
        await new Promise((resolve) => {
          setTimeout(() => resolve(true), 2000);
        });

        const req: any = { headers: { authorization: "Bearer " + token } };
        await middleware.use(req, {}, jest.fn());

        expect(req.user).toBeUndefined();
      });

      it("対象ユーザーが存在しない場合、request.userに操作ユーザーが格納されないこと", async () => {
        spyFindUser.mockResolvedValue(null);

        const req: any = { headers: { authorization: "Bearer " + token } };
        await middleware.use(req, {}, jest.fn());

        expect(req.user).toBeUndefined();
      });

      it("対象ユーザーも存在する場合、request.userに操作ユーザーが格納されること", async () => {
        const req: any = { headers: { authorization: "Bearer " + token } };
        await middleware.use(req, {}, jest.fn());

        expect(req.user).toMatchObject(user);
      });
    });
  });
});
