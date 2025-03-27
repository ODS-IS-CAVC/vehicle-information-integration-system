import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { S3Service } from "../util/s3.service";
import { Lidar } from "src/entities/pointcloud/lidar.entity";
import { LoggerService } from "../util/logger/logger.service";

@Injectable()
export class FileAttributesService {
  constructor(
    private readonly s3Service: S3Service,
    @InjectRepository(Lidar)
    private readonly lidarRepository: Repository<Lidar>,

    private readonly loggerService: LoggerService,
  ) {}
  /**
   * ファイル属性データモデル取得
   * @param condition 検索条件
   * @returns ファイル属性データモデル
   */
  async getFileAttributes(condition) {
    try {
      const data = await this.lidarRepository
        .createQueryBuilder("li")
        .select("li.is_potree_converted", "isPotreeConverted")
        .addSelect("li.key_path", "keyPath")
        .addSelect("li.added_datetime", "created")
        .addSelect("li.geom", "coordinates")
        .where("li.orig_laz_path like :condition", { condition: `%${condition.fileName}` })
        .andWhere("li.is_potree_converted = :isPotreeConverted", { isPotreeConverted: false })
        .getRawOne();

      if (data == null) {
        throw new NotFoundException();
      }
      const bucketKeyPath = data.keyPath.split("/");
      // kyePathを/で分割した先頭がbucket名
      const bucket = bucketKeyPath.shift();
      // 残りがkyePath
      const key = bucketKeyPath.join("/");
      // ファイルサイズの取得のため、S3にアクセス
      const fileAttributes = await this.s3Service.getS3FileAttributes(bucket, key);
      // S3にファイルが存在しない場合
      if (fileAttributes.Contents === undefined) {
        Logger.log("S3にファイルが存在しない");
        throw new NotFoundException();
      }
      // 返却値作成
      const result = {
        dataModelType: "test1",
        attribute: {
          fileName: condition.fileName,
          type: "laz",
          size: fileAttributes.Contents[0].Size,
          created: data.created,
          coordinates: data.coordinates,
        },
      };
      return result;
    } catch (e) {
      this.loggerService.error(e);
      throw e;
    }
  }
}
