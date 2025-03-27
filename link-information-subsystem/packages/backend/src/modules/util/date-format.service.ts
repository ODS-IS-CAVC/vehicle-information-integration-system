import { BadRequestException, Injectable } from "@nestjs/common";
import { CaJpFormat } from "src/consts/date.const";
import dayjs from "src/shares/lib/dayjs";
import { LoggerService } from "./logger/logger.service";

@Injectable()
export class DateFormatService {
  constructor(private readonly loggerService: LoggerService) {}

  /**
   * 日付変換
   * @param timestamp 日時
   * @param dateFormat 西暦フォーマット
   * @param caJpOption 和暦フォーマット
   * @returns フォーマットした日付
   */
  formatDate(timestamp: string, dateFormat: string = "YYYY/MM/DD", caJpOption?: CaJpFormat): string {
    const date = new Date(timestamp);

    if (Number.isNaN(date.getDate())) {
      this.loggerService.error(new BadRequestException());
      throw new BadRequestException();
    }

    if (!!caJpOption) {
      // 和暦変換
      const formattedTimestamp = date.toLocaleDateString("ja-JP-u-ca-japanese", caJpOption);
      return formattedTimestamp;
    } else {
      // 西暦変換
      const formattedTimestamp = dayjs(date).utc().format(dateFormat);
      return formattedTimestamp;
    }
  }
}
