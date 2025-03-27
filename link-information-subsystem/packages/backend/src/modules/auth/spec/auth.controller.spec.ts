import { InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { Users } from "src/entities/share/users.entity";
import { USER_TYPE } from "src/consts/user.const";
import { UserService } from "../../user/user.service";
import { AuthController } from "../auth.controller";
import { AuthService } from "../auth.service";
import { LoggerService } from "src/modules/util/logger/logger.service";
import { CannotExecuteNotConnectedError } from "typeorm";

describe("AuthController", () => {
  let controller: AuthController;
  let service: AuthService;
  let userService: UserService;
  let logger: LoggerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: { createTokenByUser: jest.fn() } },
        { provide: UserService, useValue: { findUserByLoginIdAndPassword: jest.fn() } },
        { provide: LoggerService, useValue: { loginLog: jest.fn(), error: jest.fn() } },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    logger = module.get<LoggerService>(LoggerService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("login", () => {
    let spyLog: jest.SpyInstance;
    let spyErrorLog: jest.SpyInstance;

    beforeEach(async () => {
      spyLog = jest.spyOn(logger, "loginLog");
      spyErrorLog = jest.spyOn(logger, "error");
    });

    it("該当サービス処理が実行されること", async () => {
      const user = new Users();
      user.loginId = "loginId123";
      user.userType = USER_TYPE.NORMAL;

      const spyServiceFindUser = jest.spyOn(userService, "findUserByLoginIdAndPassword").mockResolvedValue(user);
      const spyServiceCreateToken = jest.spyOn(service, "createTokenByUser").mockResolvedValue("tokentoken");

      const body = { loginId: "loginId123", password: "password456" };
      const result = await controller.login(body);

      expect(result).toEqual({ token: "tokentoken" });

      expect(spyServiceFindUser).toHaveBeenCalledWith("loginId123", "password456");
      expect(spyServiceCreateToken).toHaveBeenCalledWith(user);
      expect(spyLog).toHaveBeenCalledWith({ userId: "loginId123", doLogin: true, sourceIp: "" });
    });

    it("該当ユーザーが存在しない場合、NotFoundExceptionがThrowされること", async () => {
      jest.spyOn(userService, "findUserByLoginIdAndPassword").mockResolvedValue(null);

      const body = { loginId: "loginId123", password: "password456" };

      // アサーションの呼び出し確認
      expect.assertions(3);
      // 実行して結果を比較
      await expect(controller.login(body, "10.20.30.456")).rejects.toThrow(NotFoundException);
      // LoggerServiceが呼び出されたか確認
      expect(spyLog).toHaveBeenCalledWith({ userId: "loginId123", doLogin: false, sourceIp: "10.20.30.456" });
      expect(spyErrorLog).toHaveBeenCalledWith(new NotFoundException());
    });

    it("DB接続が失敗した場合、InternalServerErrorExceptionがThrowされること", async () => {
      jest.spyOn(userService, "findUserByLoginIdAndPassword").mockImplementation(() => {
        throw new CannotExecuteNotConnectedError("DB接続エラー");
      });

      const body = { loginId: "loginId123", password: "password456" };

      // アサーションの呼び出し確認
      expect.assertions(1);
      // 実行して結果を比較
      await expect(controller.login(body, "10.20.30.456")).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("ユーザー情報取得(reLogin)", () => {
    let user: Users;
    beforeEach(() => {
      user = new Users();
      user.loginId = "User123";
      user.userType = USER_TYPE.NORMAL;
    });

    it("ログインユーザー情報が返却されること", async () => {
      expect(await controller.reLogin(user)).toEqual({
        loginId: "User123",
      });
    });
  });
});
