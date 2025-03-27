import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CodeMaster } from "src/entities/share/code-master.entity";
import { Repository } from "typeorm";
import { LoggerService } from "./logger/logger.service";

@Injectable()
export class CodeNameService {
  constructor(
    @InjectRepository(CodeMaster)
    private readonly codeMasterRepository: Repository<CodeMaster>,
    private readonly loggerService: LoggerService,
  ) {}

  /**
   * コード名称取得
   * @param keys キー
   * @returns コード名称
   */
  async getCodeName(keys: string[]): Promise<string[]> {
    try {
      // 削除以外のコード名称取得
      const values: CodeMaster[] = await this.codeMasterRepository
        .createQueryBuilder("cm")
        .select("cm.value")
        .where("cm.key IN (:...key)", { key: keys })
        .andWhere("cm.delete_flg = :deleteFlg", { deleteFlg: 0 })
        .getMany();

      const names: string[] = values.map((v) => v.value);
      return names;
    } catch (e) {
      this.loggerService.error(e);
      throw e;
    }
  }
}
