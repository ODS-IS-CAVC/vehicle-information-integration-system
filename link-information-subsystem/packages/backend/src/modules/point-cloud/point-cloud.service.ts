import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PointCloudSplitManage } from "src/entities/share/point-cloud-split-manage.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { RESULT_SUCCESS } from "src/consts/openapi.const";
import { S3Service } from "../util/s3.service";
import { Users } from "src/entities/share/users.entity";
import { Lidar } from "src/entities/pointcloud/lidar.entity";
import { CropMap } from "../shares/crop/crop";
import { CoordinateService } from "../util/coordinate.service";
import { DataSource } from "typeorm";
import { InjectDataSource } from "@nestjs/typeorm";
import { Convert } from "../shares/lib/convert";
import { LoggerService } from "../util/logger/logger.service";
import { ISSUED_URL_STATUS } from "src/consts/point-clound.const";

@Injectable()
export class PointCloudService {
  constructor(
    @InjectRepository(PointCloudSplitManage)
    private readonly pointCloudSplitManageRepository: Repository<PointCloudSplitManage>,
    private readonly s3Service: S3Service,
    @InjectRepository(Lidar)
    private readonly lidarRepository: Repository<Lidar>,
    private readonly coordinateService: CoordinateService,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly loggerService: LoggerService,
  ) {}
  /**
   * 点群データ一覧取得
   * @param condition 検索条件
   * @returns 点群データ一覧
   */
  async getPointcloudList(condition) {
    let geom;
    try {
      // bbox, city, mesh, lat, lonの指定がない場合
      const geomKeys = ["bbox", "city", "mesh", "lat", "lon"];
      const hasGeomKeys = geomKeys.some((key) => condition?.hasOwnProperty(key));
      if (!hasGeomKeys) {
        throw new BadRequestException();
      }

      if (condition.lat !== undefined && condition.lon === undefined) {
        throw new BadRequestException();
      }
      if (condition.lat === undefined && condition.lon !== undefined) {
        throw new BadRequestException();
      }
      if (condition.lat !== undefined && condition.lon !== undefined) {
        if (condition.lat > 90 || condition.lat < -90) {
          throw new BadRequestException();
        }
        if (condition.lon > 180 || condition.lon < -180) {
          throw new BadRequestException();
        }
        geom = {
          type: "Point",
          coordinates: [condition.lon, condition.lat],
        };

        const rows = await this.lidarRepository
          .createQueryBuilder("li")
          .select("li.id", "pointCloudUniqueId")
          .addSelect("li.s3_path", "url")
          .addSelect("li.scene_name", "sceneName")
          .addSelect("li.acquisition_date", "acquisitionDate")
          .addSelect("li.tags", "tags")
          .addSelect("li.key_path", "keyPath")
          .addSelect("ST_AsGeoJSON (li.geom)", "geometry")
          .where("ST_Intersects(ST_Buffer(ST_GeomFromGeoJSON(:geojsonString), 0.00005, 'quad_segs=8'),ST_Transform(li.geom, 4326))", {
            geojsonString: JSON.stringify(geom),
          })
          .andWhere("li.is_potree_converted=true")
          .getRawMany();

        if (rows.length === 0) {
          return {
            type: "FeatureCollection",
            features: [],
          };
        }
        const returnData: any = [];
        for (const item of rows) {
          const bucketKeyPath = item.keyPath.split("/");
          // kyePathを/で分割した先頭がbucket名
          const bucket = bucketKeyPath.shift();
          // 残りのkyePathとリクエストのファイル名を連結
          const key = bucketKeyPath.join("/") + "/" + "metadata.json";
          const hierarchyKey = bucketKeyPath.join("/") + "/" + "hierarchy.bin";
          const octreeKey = bucketKeyPath.join("/") + "/" + "octree.bin";
          const presignedUrl = await this.s3Service.createPresignedUrlWithClient(bucket, key);
          const hierarchyUrl = await this.s3Service.createPresignedUrlWithClient(bucket, hierarchyKey);
          const octreeUrl = await this.s3Service.createPresignedUrlWithClient(bucket, octreeKey);
          returnData.push({
            pointCloudUniqueId: item.pointCloudUniqueId,
            url: presignedUrl,
            sceneName: item.sceneName,
            acquisitionDate: item.acquisitionDate,
            tags: item.tags,
            geometry: item.geometry,
            hierarchyUrl: hierarchyUrl,
            octreeUrl: octreeUrl,
          });
        }
        const geojson = Convert.rowsToGeojson(returnData);
        return geojson;
      } else {
        if (condition.bbox) {
          condition.bbox = condition.bbox.split(",");
        }
        // メッシュコード
        if (condition.mesh) {
          const bbox = this.coordinateService.transformMeshToBBox(condition.mesh);
          condition.bbox = bbox;
        }
        geom = await CropMap.createCropMultiPolygon(this.dataSource, {
          // バウンディングボックス
          bbox: condition.bbox || "",
          // 行政区画コード
          cities: condition.city ? condition.city : "",
        });

        const rows = await this.lidarRepository
          .createQueryBuilder("li")
          .select("li.id", "pointCloudUniqueId")
          .addSelect("li.s3_path", "url")
          .addSelect("li.scene_name", "sceneName")
          .addSelect("li.acquisition_date", "acquisitionDate")
          .addSelect("li.tags", "tags")
          .addSelect("li.key_path", "keyPath")
          .addSelect("ST_AsGeoJSON (li.geom)", "geometry")
          .where("ST_Intersects(ST_Transform(ST_GeomFromGeoJSON(:geojsonString),6697),li.geom)", { geojsonString: JSON.stringify(geom) })
          .andWhere("li.is_potree_converted=true")
          .getRawMany();

        if (rows.length === 0) {
          return {
            type: "FeatureCollection",
            features: [],
          };
        }
        const returnData: any = [];
        for (const item of rows) {
          const bucketKeyPath = item.keyPath.split("/");
          // kyePathを/で分割した先頭がbucket名
          const bucket = bucketKeyPath.shift();
          // 残りのkyePathとリクエストのファイル名を連結
          const key = bucketKeyPath.join("/") + "/" + "metadata.json";
          const hierarchyKey = bucketKeyPath.join("/") + "/" + "hierarchy.bin";
          const octreeKey = bucketKeyPath.join("/") + "/" + "octree.bin";
          const hierarchyUrl = await this.s3Service.createPresignedUrlWithClient(bucket, hierarchyKey);
          const octreeUrl = await this.s3Service.createPresignedUrlWithClient(bucket, octreeKey);
          const presignedUrl = await this.s3Service.createPresignedUrlWithClient(bucket, key);
          returnData.push({
            pointCloudUniqueId: item.pointCloudUniqueId,
            url: presignedUrl,
            sceneName: item.sceneName,
            acquisitionDate: item.acquisitionDate,
            tags: item.tags,
            geometry: item.geometry,
            hierarchyUrl: hierarchyUrl,
            octreeUrl: octreeUrl,
          });
        }
        const geojson = Convert.rowsToGeojson(returnData);
        return geojson;
      }
    } catch (e) {
      this.loggerService.error(e);
      throw e;
    }
  }
  /**
   * 点群データ分割(切出)処理状況取得
   * @param condition ユーザー情報
   * @returns 点群データ分割(切出)処理状況
   */
  async getPointcloudSplitStatus(user: Users) {
    try {
      // DBから取得
      const splitStatusList = await this.pointCloudSplitManageRepository
        .createQueryBuilder("pcsm")
        .select("pcsm.id", "requestId")
        .addSelect("pcsm.created_at", "requestDate")
        .addSelect("pcsm.file_status", "status")
        .innerJoin(Users, "us", "us.id = pcsm.user_id")
        .innerJoin(Lidar, "li", "li.id = pcsm.point_cloud_unique_id")
        .addSelect("li.scene_name", "pointCloudSceneName")
        .where("pcsm.user_id = :userId", { userId: user.id })
        .orderBy("pcsm.created_at", "DESC")
        .getRawMany();
      if (splitStatusList.length === 0) {
        return { splitStatusList: [] };
      }
      return { splitStatusList: splitStatusList };
    } catch (e) {
      this.loggerService.error(e);
      throw e;
    }
  }
  /**
   * 分割済み点群データダウンロードURL取得
   * @param condition 分割申請ID
   * @returns 分割済み点群データダウンロードURL
   */
  async getPointcloudDlUrl(condition) {
    // todo パラメータチェック機能呼び出しを追加
    try {
      // DBから取得
      const data = await this.pointCloudSplitManageRepository
        .createQueryBuilder("pcsm")
        .select("pcsm.s3_bucket", "s3Bucket")
        .addSelect("pcsm.s3_key", "s3Key")
        .where("pcsm.id = :requestId", { requestId: condition.requestId })
        .getRawOne();
      if (data == null) {
        throw new NotFoundException();
      }
      const url = await this.s3Service.createPresignedUrlWithClient(data.s3Bucket, data.s3Key);

      // ダウンロード用URL発行済みにステータスを更新
      await this.pointCloudSplitManageRepository
        .createQueryBuilder()
        .update(PointCloudSplitManage)
        .set({
          fileStatus: ISSUED_URL_STATUS,
        })
        .where("id = :requestId", { requestId: condition.requestId })
        .execute();

      return { url: url };
    } catch (e) {
      this.loggerService.error(e);
      throw e;
    }
  }
  /**
   * 点群データ分割(切出)申請
   * @param condition 点群データ分割(切出)申請登録用情報
   * @returns 登録結果
   */
  async putPointCloudSplit(condition, user: Users) {
    try {
      if (condition.startPoint.lat > 90 || condition.startPoint.lat < -90) {
        throw new BadRequestException();
      }
      if (condition.startPoint.lon > 180 || condition.startPoint.lon < -180) {
        throw new BadRequestException();
      }
      if (condition.endPoint.lat > 90 || condition.endPoint.lat < -90) {
        throw new BadRequestException();
      }
      if (condition.endPoint.lon > 180 || condition.endPoint.lon < -180) {
        throw new BadRequestException();
      }

      // 指定された点群IDからpotree変換前の点群IDを取得
      const data = await this.lidarRepository
        .createQueryBuilder("li")
        .select("li.orig_laz_path", "lazPath")
        .where("li.id = :pointCloudUniqueId", { pointCloudUniqueId: condition.pointCloudUniqueId })
        .getRawOne();

      if (data == null) {
        Logger.log("potree変換前の点群データが見つからない。");
        throw new NotFoundException();
      }
      const target = await this.lidarRepository
        .createQueryBuilder("li")
        .select("li.id", "id")
        .where("li.id != :pointCloudUniqueId", { pointCloudUniqueId: condition.pointCloudUniqueId })
        .andWhere("li.orig_laz_path = :lazPath", { lazPath: data.lazPath })
        .getRawOne();
      if (target == null) {
        Logger.log("potree変換前の点群データが見つからない。");
        throw new NotFoundException();
      }
      // DBに登録
      await this.pointCloudSplitManageRepository
        .createQueryBuilder("pcsm")
        .insert()
        .into(PointCloudSplitManage)
        .values([
          {
            userId: user.id,
            pointCloudUniqueId: target.id,
            startLat: condition.startPoint.lat,
            startLon: condition.startPoint.lon,
            endLat: condition.endPoint.lat,
            endLon: condition.endPoint.lon,
          },
        ])
        .execute();

      return { result: RESULT_SUCCESS };
    } catch (e) {
      this.loggerService.error(e);
      throw e;
    }
  }
  /**
   * 分割後点群データ削除
   * @param condition 分割申請ID
   * @returns 削除結果
   */
  async deletePointcloudSplitFile(condition) {
    try {
      const data = await this.pointCloudSplitManageRepository
        .createQueryBuilder("pcsm")
        .where("id = :id", { id: condition.requestId })
        .getOne();
      if (data == null) {
        throw new NotFoundException();
      }
      // 作成失敗以外のステータスの場合はS3からも削除
      if (data.fileStatus != 99) {
        // S3から削除
        const result = this.s3Service.s3Delete(data.s3Bucket, data.s3Key);
        Logger.log(result);
      }
      // DBから削除
      await this.pointCloudSplitManageRepository
        .createQueryBuilder("pcsm")
        .delete()
        .where("id = :id", { id: condition.requestId })
        .execute();
      return { result: RESULT_SUCCESS };
    } catch (e) {
      this.loggerService.error(e);
      throw e;
    }
  }
}
