import { Test } from "@nestjs/testing";
import { LoggerService } from "../logger.service";
import { createMock } from "@golevelup/ts-jest";
import { Request, Response } from "express";
import { ArgumentsHost, HttpStatus } from "@nestjs/common";
import { HttpArgumentsHost } from "@nestjs/common/interfaces";

describe("LoggerService", () => {
  let req: Request;
  let res: Response;
  let service: LoggerService;

  const MOCK_USER_ID = "user10";
  const MOCK_PASSWORD = "user10";

  beforeEach(async () => {
    req = createMock<Request>({
      url: "/v1/voxels",
      path: "/v1/voxels",
      method: "GET",
      body: { loginId: MOCK_USER_ID, password: MOCK_PASSWORD },
      query: { mesh: "12345" },
    });

    res = createMock<Response>({ statusCode: HttpStatus.OK });

    createMock<ArgumentsHost>({
      switchToHttp: () =>
        createMock<HttpArgumentsHost>({
          getRequest: () => req,
          getResponse: () => res,
        }),
    });

    const module = await Test.createTestingModule({
      providers: [LoggerService],
    }).compile();

    service = module.get<LoggerService>(LoggerService);
  });

  it("LoggerServiceが呼び出されること。", () => {
    expect(service).toBeDefined();
  });

  describe("error, accessLogFailed", () => {
    it("APIエラーの場合、ログが出力されること", () => {
      const error = new Error();
      const data = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
      const spyError = jest.spyOn(service, "error");

      service.error(data);
      expect(spyError).toHaveBeenCalledWith(data);
    });

    it("APIアクセスに失敗し、ログが出力されること", () => {
      const spyAccessFailed = jest.spyOn(service, "accessLogFailed");

      const data = {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        userId: MOCK_USER_ID,
        sourceIp: req.ip,
      };

      service.accessLogFailed(data);
      expect(spyAccessFailed).toHaveBeenCalledWith(data);
    });
  });

  describe("accessLogSuccess, loginLog", () => {
    it("APIアクセスに成功し、ログが出力されること", () => {
      const spyLogSuccess = jest.spyOn(service, "accessLogSuccess");

      const data = {
        statusCode: HttpStatus.OK,
        userId: MOCK_USER_ID,
        sourceIp: req.ip,
      };

      service.accessLogSuccess(data);
      expect(spyLogSuccess).toHaveBeenCalledWith(data);
    });

    it("ログインに成功し、ログが出力されること", () => {
      const spyLoginLog = jest.spyOn(service, "loginLog");

      const data = {
        userId: MOCK_USER_ID,
        doLogin: Boolean(MOCK_USER_ID),
        sourceIp: req.ip,
      };

      service.loginLog(data);
      expect(spyLoginLog).toHaveBeenCalledWith(data);
    });
  });

  describe("validationError", () => {
    it("バリデーションエラーの場合、エラーログが出力されること。", () => {
      const error = new Error();
      const spyValidationError = jest.spyOn(service, "validationError");

      const data = {
        statusCode: 400,
        message: error.message,
        stack: error.stack,
      };

      service.validationError(data);
      expect(spyValidationError).toHaveBeenCalledWith(data);
    });
  });
});
