import { SnsNotificationService } from "../sns-notification.service";
import { Test, TestingModule } from "@nestjs/testing";
import { CannotExecuteNotConnectedError, Repository } from "typeorm";
import { getRepositoryToken, TypeOrmModule } from "@nestjs/typeorm";
import { SnsErrorCount } from "src/entities/share/sns-error-counts";
import { LoggerService } from "../logger/logger.service";
import { createDb, resetDb } from "./db-reset";
import { PublishCommand, PublishCommandOutput } from "@aws-sdk/client-sns";
import { InternalServerErrorException, NotFoundException } from "@nestjs/common";

let isSuccess = true;
const publishSuccessResponse = { $metadata: { httpStatusCode: 200 } } as PublishCommandOutput;
const publishFailedResponse = { $metadata: { httpStatusCode: 400 } } as PublishCommandOutput;
jest.mock("@aws-sdk/client-sns", () => {
  const mockSnsClient = {
    send: jest.fn((command) => {
      if (command instanceof PublishCommand) {
        return isSuccess ? Promise.resolve(publishSuccessResponse) : Promise.resolve(publishFailedResponse);
      }
    }),
  } as any;
  return {
    SNSClient: jest.fn(() => mockSnsClient),
    PublishCommand: jest.fn(),
  };
});

describe("SnsNotificationService", () => {
  let snsNotificationService: SnsNotificationService;
  let loggerService: LoggerService;
  let snsErrorCountRepository: Repository<SnsErrorCount>;

  afterAll(async () => {
    await resetDb();
    await module.close();
  });

  beforeAll(async () => {
    await createDb();
  });

  let module: TestingModule;
  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: "postgres",
          host: "database",
          port: 5432,
          username: "postgres",
          password: "postgres",
          database: "postgres",
          autoLoadEntities: true,
        }),
        TypeOrmModule.forFeature([SnsErrorCount]),
      ],
      providers: [SnsNotificationService, LoggerService],
    }).compile();

    snsNotificationService = module.get<SnsNotificationService>(SnsNotificationService);
    loggerService = module.get<LoggerService>(LoggerService);
    snsErrorCountRepository = module.get<Repository<SnsErrorCount>>(getRepositoryToken(SnsErrorCount));

    // 毎回カウント0にリセットする
    const updated = await snsErrorCountRepository.findOneBy({
      content: errorContent,
    });
    await snsErrorCountRepository.save({ ...updated, count: 0 });
  });

  it("should be defined", () => {
    expect(snsNotificationService).toBeDefined();
  });

  const errorContent = "errorcontent";
  const apiName = "sampleApiName";

  describe("notifyError", () => {
    it("カウントアップした値が閾値より小さい場合は通知を行わずカウントの更新のみ行う", async () => {
      const first: SnsErrorCount = await snsErrorCountRepository.findOneBy({ content: errorContent });
      const result: boolean = await snsNotificationService.notifyError(apiName, errorContent);
      const after: SnsErrorCount = await snsErrorCountRepository.findOneBy({ content: errorContent });
      expect(after.count).toBe(first.count + 1);
      expect(after.count < first.threshold).toBe(true);
      expect(result).toBe(true);
    });

    it("カウントアップした値が閾値以上だがSNS通知に失敗した場合、カウントアップした値でDB更新してからInternalServerErrorExceptionエラーを出す", async () => {
      const first: SnsErrorCount = await snsErrorCountRepository.findOneBy({ content: errorContent });
      // 閾値より１少ない回数まで呼び出し
      for (let i = 0; i < first.threshold - 1; i++) {
        await snsNotificationService.notifyError(apiName, errorContent);
      }
      expect((await snsErrorCountRepository.findOneBy({ content: errorContent })).count).toBe(first.threshold - 1);
      isSuccess = false; //失敗したときのレスポンスを設定
      const spyLoggerService = jest.spyOn(loggerService, "error");

      await expect(snsNotificationService.notifyError(apiName, errorContent)).rejects.toThrow(InternalServerErrorException);
      expect(spyLoggerService).toHaveBeenCalledWith(new InternalServerErrorException());
    });

    it("カウントアップした値が閾値以上の場合は通知を行い、成功した場合はカウントを0で更新する", async () => {
      const first: SnsErrorCount = await snsErrorCountRepository.findOneBy({ content: errorContent });
      // 閾値より１少ない回数まで呼び出し
      for (let i = 0; i < first.threshold - 1; i++) {
        await snsNotificationService.notifyError(apiName, errorContent);
      }
      expect((await snsErrorCountRepository.findOneBy({ content: errorContent })).count).toBe(first.threshold - 1);
      isSuccess = true;
      const result = await snsNotificationService.notifyError(apiName, errorContent);

      const after: SnsErrorCount = await snsErrorCountRepository.findOneBy({ content: errorContent });
      expect(after.count).toBe(0);
      expect(result).toBe(true);
    });

    it("DBからカウントの値取得に失敗した場合、エラーを出す", async () => {
      snsErrorCountRepository.findOneBy = jest.fn().mockRejectedValue(new CannotExecuteNotConnectedError("DB connection error"));
      const spyLoggerService = jest.spyOn(loggerService, "error");

      await expect(snsNotificationService.notifyError(apiName, errorContent)).rejects.toThrow(CannotExecuteNotConnectedError);
      expect(spyLoggerService).toHaveBeenCalledWith(new CannotExecuteNotConnectedError("DB connection error"));
    });

    it("DBに該当カウントが存在しない場合、NotfoundExceptionを出す", async () => {
      const spyLoggerService = jest.spyOn(loggerService, "error");

      await expect(snsNotificationService.notifyError(apiName, "not-found-error-content")).rejects.toThrow(NotFoundException);
      expect(spyLoggerService).toHaveBeenCalledWith(new NotFoundException());
    });
  });
});
