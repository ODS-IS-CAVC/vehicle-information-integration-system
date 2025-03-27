import { createMock } from "@golevelup/ts-jest";
import { ExecutionContext, UnauthorizedException } from "@nestjs/common";

import { RoleGuard } from "../role.guard";
import { Users } from "src/entities/share/users.entity";
import { ROLE } from "../../../../consts/role.const";
import { HttpService } from "@nestjs/axios";
import { of } from "rxjs";
import { AxiosResponse } from "axios";
import { LoggerService } from "src/modules/util/logger/logger.service";

describe("RoleGuard", () => {
  let mockContext: any;
  let guard: RoleGuard;
  let httpService: HttpService;
  let loggerService: LoggerService;

  beforeEach(async () => {
    mockContext = createMock<ExecutionContext>();
    httpService = new HttpService();
    loggerService = new LoggerService();
    guard = new RoleGuard([ROLE.USER], httpService, loggerService);
  });

  it("should be defined", () => {
    expect(guard).toBeDefined();
  });

  it("ログインユーザー情報が存在しない、かつトークン検証に失敗した場合、認証が失敗すること", async () => {
    const data = { active: false };
    const response = {
      data,
      headers: {},
      status: 200,
      statusText: "OK",
    } as AxiosResponse;

    jest.spyOn(httpService, "post").mockImplementationOnce(() => of(response));
    mockContext.switchToHttp().getRequest.mockReturnValue({
      headers: {
        authorization: "authorization",
        apiKey: "apiKey",
      },
    });
    const result = guard.canActivate(mockContext);
    expect(result).rejects.toThrow(UnauthorizedException);
  });

  it("ログインユーザー情報が存在しないがトークン検証に成功した場合、認証が成功すること", async () => {
    const data = { active: true };
    const response = {
      data,
      headers: {},
      status: 200,
      statusText: "OK",
    } as AxiosResponse;

    jest.spyOn(httpService, "post").mockImplementationOnce(() => of(response));
    mockContext.switchToHttp().getRequest.mockReturnValue({
      headers: {
        authorization: "authorization",
        apiKey: "apiKey",
      },
    });
    const result = await guard.canActivate(mockContext);
    expect(result).toBe(true);
  });

  describe("ログインユーザー情報が存在する場合", () => {
    let user: Users;

    beforeEach(() => {
      user = new Users();
    });

    it("ロールが空の場合、401エラーが返却されること", async () => {
      httpService = new HttpService();
      loggerService = new LoggerService();
      guard = new RoleGuard([], httpService, loggerService);
      mockContext.switchToHttp().getRequest.mockReturnValue({ user });
      await expect(() => guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
    });
    it("認証に成功した場合、trueが返却されること", async () => {
      mockContext.switchToHttp().getRequest.mockReturnValue({ user });
      expect(guard.canActivate(mockContext)).toBeTruthy();
    });
  });
});
