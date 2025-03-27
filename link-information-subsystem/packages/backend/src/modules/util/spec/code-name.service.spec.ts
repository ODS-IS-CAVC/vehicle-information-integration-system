import { Test, TestingModule } from "@nestjs/testing";
import { CodeNameService } from "../code-name.service";
import { CodeMaster } from "src/entities/share/code-master.entity";
import { Repository } from "typeorm";
import { getRepositoryToken } from "@nestjs/typeorm";
import { CannotExecuteNotConnectedError } from "typeorm";
import { LoggerService } from "../logger/logger.service";

describe("CodeNameService", () => {
  let codeNameService: CodeNameService;
  let loggerService: LoggerService;
  let codeMasterRepository: Repository<CodeMaster>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CodeNameService,
        LoggerService,
        {
          provide: getRepositoryToken(CodeMaster),
          useClass: Repository,
        },
      ],
    }).compile();

    codeNameService = module.get<CodeNameService>(CodeNameService);
    loggerService = module.get<LoggerService>(LoggerService);
    codeMasterRepository = module.get<Repository<CodeMaster>>(getRepositoryToken(CodeMaster));
  });

  it("should be defined", () => {
    expect(codeNameService).toBeDefined();
  });

  describe("getCodeName", () => {
    it("キーが1つ(『key1』)の場合に対応するコード名称(['name1'])が返却されること", async () => {
      // モックデータの設定
      codeMasterRepository.createQueryBuilder = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          {
            value: "name1",
          },
        ]),
      });

      // 期待値
      const expectedValue = ["name1"];

      // アサーションの呼び出し確認
      expect.assertions(1);
      // 実行して結果を比較
      await expect(codeNameService.getCodeName(["key1"])).resolves.toStrictEqual(expectedValue);
    });

    it("キーが複数(『key1』『key2』)の場合に対応するコード名称(['name1', 'name2', 'name3', 'name4', 'name5'])が返却されること", async () => {
      // モックデータの設定
      codeMasterRepository.createQueryBuilder = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          {
            value: "name1",
          },
          {
            value: "name2",
          },
          {
            value: "name3",
          },
          {
            value: "name4",
          },
          {
            value: "name5",
          },
        ]),
      });

      // 期待値
      const expectedValue = ["name1", "name2", "name3", "name4", "name5"];

      // アサーションの呼び出し確認
      expect.assertions(1);
      // 実行して結果を比較
      await expect(codeNameService.getCodeName(["key1", "key2"])).resolves.toStrictEqual(expectedValue);
    });

    it("DB接続が失敗した場合はLoggerService.errorが呼び出されCannotExecuteNotConnectedErrorがスローされること", async () => {
      // モックデータの設定
      codeMasterRepository.createQueryBuilder = jest.fn().mockImplementation(() => {
        throw new CannotExecuteNotConnectedError("DB接続エラー");
      });

      const spyLoggerService = jest.spyOn(loggerService, "error");

      // アサーションの呼び出し確認
      expect.assertions(2);
      // 実行して結果を比較
      await expect(codeNameService.getCodeName(["key1"])).rejects.toThrow(CannotExecuteNotConnectedError);
      // LoggerService.errorが呼び出されたか確認
      expect(spyLoggerService).toHaveBeenCalledWith(new CannotExecuteNotConnectedError("DB接続エラー"));
    });
  });
});
