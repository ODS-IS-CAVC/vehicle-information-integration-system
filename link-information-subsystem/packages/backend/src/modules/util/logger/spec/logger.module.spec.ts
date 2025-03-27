import { Test, TestingModule } from "@nestjs/testing";
import { LoggerModule } from "../logger.module";
import { LoggerService } from "../logger.service";

describe("LoggerModule", () => {
  let module: TestingModule;
  beforeEach(async () => {
    module = await Test.createTestingModule({ imports: [LoggerModule] }).compile();
  });

  it("LoggerModuleが呼び出されること。", async () => {
    expect(module).toBeDefined();
    expect(module.get<LoggerService>(LoggerService)).toBeInstanceOf(LoggerService);
  });
});
