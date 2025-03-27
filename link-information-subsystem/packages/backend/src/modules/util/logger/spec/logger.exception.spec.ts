import { createMock } from "@golevelup/ts-jest";
import { ArgumentsHost, HttpArgumentsHost } from "@nestjs/common/interfaces";
import { Test, TestingModule } from "@nestjs/testing";
import { Request, Response } from "express";
import { LoggerService } from "../logger.service";
import { AbstractHttpAdapter, HttpAdapterHost } from "@nestjs/core";
import { LoggerExceptionFilter } from "../logger-exception.filter";
import { BadRequestException, HttpStatus, NotFoundException } from "@nestjs/common";
import { Users } from "src/entities/share/users.entity";

describe("LoggerExceptionFilter", () => {
  let req;
  let res: Response;
  let exceptionFilter: LoggerExceptionFilter;
  let service: LoggerService;

  let argumentHost: ArgumentsHost;
  let spyValidationError: jest.SpyInstance;
  let spyAccessLogFailed: jest.SpyInstance;

  const MOCK_USER_ID = "user10";

  beforeEach(async () => {
    req = createMock<Request>({
      url: "/v1/voxels",
      path: "/v1/voxels",
      method: "GET",
      query: { city: "14104" },
    });

    const user = new Users();
    user.loginId = MOCK_USER_ID;
    req.user = user;

    res = createMock<Response>({ statusCode: HttpStatus.OK });

    argumentHost = createMock<ArgumentsHost>({
      switchToHttp: () =>
        createMock<HttpArgumentsHost>({
          getRequest: () => req,
          getResponse: () => res,
        }),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoggerExceptionFilter,
        { provide: LoggerService, useValue: createMock<LoggerService>() },
        { provide: HttpAdapterHost, useValue: createMock<HttpAdapterHost>({ httpAdapter: createMock<AbstractHttpAdapter>() }) },
      ],
    }).compile();

    exceptionFilter = module.get<LoggerExceptionFilter>(LoggerExceptionFilter);
    service = module.get<LoggerService>(LoggerService);

    spyValidationError = jest.spyOn(service, "validationError");
    spyAccessLogFailed = jest.spyOn(service, "accessLogFailed");
  });

  it("ログイン中ユーザーに400エラーが返ってきた場合、ログ出力されること", () => {
    exceptionFilter.catch(new BadRequestException(), argumentHost);

    expect(spyValidationError).toHaveBeenCalledTimes(1);
  });

  it("ログイン中ユーザーが400エラー以外のエラーが返ってきた場合、ログ出力されること", () => {
    const error = new Error();
    exceptionFilter.catch(error, argumentHost);

    expect(spyAccessLogFailed).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      userId: MOCK_USER_ID,
      sourceIp: req.ip,
    });
  });

  it("ログインしてないユーザーがAPIアクセスに失敗した場合、ログが出力されること", () => {
    req = createMock<Request>({
      url: "/v1/login",
      path: "/v1/login",
      method: "POST",
      body: { loginId: "", password: "abc" },
    });

    const user = new Users();
    user.loginId = "";
    req.user = user;

    exceptionFilter.catch(new NotFoundException(), argumentHost);

    expect(spyAccessLogFailed).toHaveBeenCalledWith({
      statusCode: HttpStatus.NOT_FOUND,
      userId: "",
      sourceIp: req.ip,
    });
  });
});
