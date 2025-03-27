import { createMock } from "@golevelup/ts-jest";
import { LoggerService } from "../logger.service";
import { Test, TestingModule } from "@nestjs/testing";
import { Request, Response } from "express";
import { HttpStatus } from "@nestjs/common";
import { CallHandler, ExecutionContext, HttpArgumentsHost } from "@nestjs/common/interfaces";
import { from, lastValueFrom } from "rxjs";
import { LoggerInterceptor } from "../logger.interceptor";
import { Users } from "src/entities/share/users.entity";

describe("LoggerInterceptor", () => {
  let req;
  let res: Response;
  let interceptor: LoggerInterceptor;
  let service: LoggerService;
  let context: ExecutionContext;
  let next: CallHandler;
  let spyAccessLogSuccess: jest.SpyInstance;

  const MOCK_USER_ID = "user10";

  beforeEach(async () => {
    req = createMock<Request>({
      url: "/v1/voxels",
      path: "/v1/voxels",
      method: "GET",
      query: { mesh: "53391531" },
    });

    res = createMock<Response>({ statusCode: HttpStatus.OK });

    const switchToHttp = createMock<HttpArgumentsHost>({
      getRequest: () => req,
      getResponse: () => res,
    });

    context = createMock<ExecutionContext>({ switchToHttp: () => switchToHttp });

    const module: TestingModule = await Test.createTestingModule({
      providers: [LoggerInterceptor, { provide: LoggerService, useValue: createMock<LoggerService>() }],
    }).compile();

    service = module.get<LoggerService>(LoggerService);

    next = createMock<CallHandler>({ handle: () => from("aaa") });

    interceptor = module.get<LoggerInterceptor>(LoggerInterceptor);
    service = module.get<LoggerService>(LoggerService);

    spyAccessLogSuccess = jest.spyOn(service, "accessLogSuccess");
  });

  it("ログイン中のユーザーがAPIアクセスに成功した場合、ログが出力されること", async () => {
    const user = new Users();
    user.loginId = MOCK_USER_ID;
    req.user = user;

    await lastValueFrom(interceptor.intercept(context, next));

    expect(spyAccessLogSuccess).toHaveBeenCalledWith({
      statusCode: HttpStatus.OK,
      userId: MOCK_USER_ID,
      sourceIp: req.ip,
    });
  });

  it("ログインしてないユーザーがAPIアクセスした場合、ログが出力されること", async () => {
    const user = new Users();
    user.loginId = "";
    req.user = user;

    await lastValueFrom(interceptor.intercept(context, next));

    expect(spyAccessLogSuccess).toHaveBeenCalledWith({
      statusCode: HttpStatus.OK,
      userId: "",
      sourceIp: req.ip,
    });
  });
});
