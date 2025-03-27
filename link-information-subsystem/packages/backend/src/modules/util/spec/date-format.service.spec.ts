import { DateFormatService } from "../date-format.service";
import { BadRequestException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { CaJPFormat } from "src/consts/date.const";
import { LoggerService } from "../logger/logger.service";

describe("DateFormatService", () => {
  let dateFormatService: DateFormatService;
  let loggerService: LoggerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DateFormatService, LoggerService],
    }).compile();

    dateFormatService = module.get<DateFormatService>(DateFormatService);
    loggerService = module.get<LoggerService>(LoggerService);
  });

  it("should be defined", () => {
    expect(dateFormatService).toBeDefined();
  });

  describe("formatDate", () => {
    // モックデータの設定(Date, DateTime)
    const mockDateTime = "2024-11-01T08:22:33Z";

    it("timestamp:『'2024-11-01T08:22:33Z'』,dateFormat:『undefined』,caJpOption:『和暦表記』の場合に変換後の日時『令和6年11月1日』が返却される", () => {
      // 実行して結果を比較
      const result = dateFormatService.formatDate(mockDateTime, undefined, CaJPFormat.kanjiDate);
      expect(result).toBe("令和6年11月1日");
    });

    it("timestamp:『'2024-11-01T08:22:33Z'』,dateFormat:『undefined』,caJpOption:『短縮和暦表記』の場合に変換後の日時『R6/11/1』が返却される", () => {
      // 実行して結果を比較
      const result = dateFormatService.formatDate(mockDateTime, undefined, CaJPFormat.numericDate);
      expect(result).toBe("R6/11/1");
    });

    it("timestamp:『'2024-11-01T08:22:33Z'』,dateFormat:『YYYY/MM/DD』,caJpOption:『undefined』の場合に変換後の日時『2024/11/01』が返却される", () => {
      // 実行して結果を比較
      const result = dateFormatService.formatDate(mockDateTime, "YYYY/MM/DD", undefined);
      expect(result).toBe("2024/11/01");
    });

    it("timestamp:『'2024-11-01T08:22:33Z'』,dateFormat:『YYYY-MM-DD HH:mm』,caJpOption:『undefined』の場合に変換後の日時『2024-11-01 08:22』が返却される", () => {
      // 実行して結果を比較
      const result = dateFormatService.formatDate(mockDateTime, "YYYY-MM-DD HH:mm", undefined);
      expect(result).toBe("2024-11-01 08:22");
    });

    it("timestamp:『'2024-11-01T08:22:33Z'』,dateFormat:『YYYY/MM/DD hh:mm:ss』,caJpOption:『undefined』の場合に変換後の日時『2024/11/01 08:22:33』が返却される", () => {
      // 実行して結果を比較
      const result = dateFormatService.formatDate(mockDateTime, "YYYY/MM/DD hh:mm:ss", undefined);
      expect(result).toBe("2024/11/01 08:22:33");
    });

    it("timestamp:『'2024-11-01T08:22:33Z'』,dateFormat:『undefined』,caJpOption:『undefined』の場合に変換後の日時『2024/11/01』が返却される", () => {
      // 実行して結果を比較
      const result = dateFormatService.formatDate(mockDateTime, undefined, undefined);
      expect(result).toBe("2024/11/01");
    });

    it("timestamp:『'ABCD'』の場合はLoggerService.errorが呼び出されBadRequestExceptionがスローされること", () => {
      const spyLoggerService = jest.spyOn(loggerService, "error");

      // 実行して結果を比較
      expect(() => dateFormatService.formatDate("ABCD", "YYYY/MM/DD hh:mm:ss", undefined)).toThrow(BadRequestException);
      // LoggerService.errorが呼び出されたか確認
      expect(spyLoggerService).toHaveBeenCalledWith(new BadRequestException());
    });

    it("timestampが空文字の場合はLoggerService.errorが呼び出されBadRequestExceptionがスローされること", () => {
      const spyLoggerService = jest.spyOn(loggerService, "error");

      // 実行して結果を比較
      expect(() => dateFormatService.formatDate("")).toThrow(BadRequestException);
      // LoggerService.errorが呼び出されたか確認
      expect(spyLoggerService).toHaveBeenCalledWith(new BadRequestException());
    });
  });
});
