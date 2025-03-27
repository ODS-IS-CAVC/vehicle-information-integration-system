import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { SharedResources } from "src/entities/share/shared-resources.entity";
import { RESULT_SUCCESS } from "src/consts/openapi.const";
import { SharedResourcesPutBodyDTO } from "./dto/resources-put-body.dto";
import { SharedResourcesPutValueDTO } from "./dto/resources-put-value.dto";
import { SharedResourcesDeleteBodyDTO } from "./dto/resources-delete-body.dto";
import { DeleteResponse, ReservationId } from "src/consts/resource.const";
import { PutResponseAttributeDTO, PutResponseStatusDTO, SharedResourcesPutResponseDTO } from "./dto/resources-put-response.dto";
import { LoggerService } from "../util/logger/logger.service";
import dayjs from "dayjs";

@Injectable()
export class ResourcesService {
  constructor(
    @InjectRepository(SharedResources)
    private readonly resourcesRepository: Repository<SharedResources>,
    private readonly loggerService: LoggerService,
  ) {}
  /**
   * 共有資源状態設定
   * @param condition 共有資源状態情報
   * @returns 共有資源状態
   */
  async putSharedResources(condition: SharedResourcesPutBodyDTO): Promise<SharedResourcesPutResponseDTO> {
    // values用の配列を生成
    const values: Array<SharedResourcesPutValueDTO> = [];
    let returnData: SharedResourcesPutResponseDTO;
    try {
      for (const item of condition.attribute.statuses) {
        const key = ReservationId;
        const validTo = !item.validUntil ? this.addOneHour(item.validFrom) : item.validUntil;
        values.push({
          dataModelType: condition.dataModelType,
          category: condition.attribute.category,
          key: key,
          value: item.value,
          validFrom: item.validFrom,
          validTo: validTo,
        });
      }
      // データベース登録
      const sharedResourcesList = await this.resourcesRepository
        .createQueryBuilder("sr")
        .insert()
        .into(SharedResources)
        .values(values)
        .returning("*")
        .execute();
      // レスポンスデータ作成
      const returnStatusesData: Array<PutResponseStatusDTO> = [];
      returnData = {
        dataModelType: sharedResourcesList.raw[0].data_model_type,
        attribute: new PutResponseAttributeDTO(),
      };
      for (const item of sharedResourcesList.raw) {
        returnData.attribute.category = item.category;
        returnStatusesData.push({
          key: item.key,
          value: item.value,
          validFrom: item.valid_from.toISOString(),
          validUntil: item.valid_to.toISOString(),
        });
      }
      returnData.attribute.statuses = returnStatusesData;
    } catch (e) {
      this.loggerService.error(e);
      throw e;
    }
    return returnData;
  }
  /**
   * 共有資源状態削除
   * @param condition 共有資源名（予約ID）
   * @returns 共有資源状態
   */
  async deleteSharedResources(condition: SharedResourcesDeleteBodyDTO): Promise<DeleteResponse> {
    try {
      await this.resourcesRepository.createQueryBuilder("sr").where(`key = :key`, { key: condition.keyFilter }).delete().execute();
      return { result: RESULT_SUCCESS };
    } catch (e) {
      this.loggerService.error(e);
      throw e;
    }
  }

  // 文字列の日時を一時間後の文字列の日時に変換
  addOneHour(dateStr: string): string {
    const date = new Date(dateStr);
    const newDate = dayjs(date).add(1, "h");
    return newDate.toISOString();
  }
}
