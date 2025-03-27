import { Injectable, InternalServerErrorException, BadRequestException, ConflictException } from "@nestjs/common";
import { Objects3d } from "src/entities/3d/object-3d.entity";
import { Objects3dOperation } from "src/entities/3d/object-3d-operation.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { Object3dResponseDTO } from "src/modules/object-3d/dto/object-3d-response.dto";
import { AWS_S3_OBJECT3D_BUCKET, AWS_S3_OBJECT3D_PATH } from "src/consts/aws.const";
import { RESULT_SUCCESS } from "src/consts/openapi.const";
import { S3Service } from "../util/s3.service";
import { LoggerService } from "../util/logger/logger.service";
@Injectable()
export class Object3dService {
  constructor(
    @InjectRepository(Objects3d)
    private readonly objects3dRepository: Repository<Objects3d>,
    @InjectRepository(Objects3dOperation)
    private readonly objects3dOperationRepository: Repository<Objects3dOperation>,
    private readonly s3Service: S3Service,
    private readonly loggerService: LoggerService,
  ) {}

  /**
   * 3dオブジェクト情報の一覧を取得
   * @returns 3dオブジェクト情報
   */
  async get3dObjectList() {
    try {
      const object3dList = await this.objects3dRepository.createQueryBuilder("o3d").orderBy("o3d.created_at", "DESC").getMany();
      if (object3dList.length === 0) {
        return { "3dObjectList": [] };
      }
      const returnData: Array<Object3dResponseDTO> = [];
      for (const item of object3dList) {
        const dlUrl = await this.s3Service.createPresignedUrlWithClient(item.s3Bucket, item.s3Key);
        returnData.push({
          object3dId: item.id,
          fileName: item.fileName,
          url: dlUrl,
        });
      }
      return { "3dObjectList": returnData };
    } catch (e) {
      this.loggerService.error(e);
      throw e;
    }
  }
  /**
   * 3dオブジェクト操作結果一覧取得
   * @param condition 検索条件
   * @returns 3dオブジェクト操作結果一覧
   */
  async getObjectOperationList(condition) {
    let data = [];
    try {
      // 操作結果情報の取得
      data = await this.objects3dOperationRepository
        .createQueryBuilder("o3do")
        .innerJoinAndSelect(Objects3d, "o3d", "o3d.id = o3do.id_3d_object")
        .where("o3do.point_cloud_unique_id = :pointCloudUniqueId", { pointCloudUniqueId: condition.pointCloudUniqueId })
        .orderBy("o3do.created_at", "DESC")
        .getRawMany();
      if (data.length === 0) {
        return { operationList: [] };
      }
      const result = [];
      for (const item of data) {
        const dlUrl = await this.s3Service.createPresignedUrlWithClient(item.o3d_s3_bucket, item.o3d_s3_key);
        result.push({
          operationId: item.o3do_id,
          title: item.o3do_title,
          pointCloudUniqueId: item.o3do_point_cloud_unique_id,
          object3dId: item.o3do_id_3d_object,
          url: dlUrl,
          putCoordinates: item.o3do_coordinates,
          xRotation: item.o3do_x_rotation,
          yRotation: item.o3do_y_rotation,
          zRotation: item.o3do_z_rotation,
          scale: item.o3do_scale,
        });
      }
      return { operationList: result };
    } catch (e) {
      this.loggerService.error(e);
      throw e;
    }
  }
  /**
   * 3dオブジェクトアップロード用URL取得
   * @param fileName ファイル名
   * @returns アップロード用URL情報
   */
  async get3dObjectUpUrl(fileName) {
    try {
      // 拡張子チェック
      if (!fileName.endsWith("glb") && !fileName.endsWith("obj")) {
        throw new BadRequestException();
      }
      // 重複チェック
      const data = await this.objects3dRepository
        .createQueryBuilder("o3d")
        .select("o3d.id")
        .where("o3d.filename = :filename", { filename: fileName })
        .getOne();
      if (data !== null) {
        throw new ConflictException();
      }
      const keyPath = AWS_S3_OBJECT3D_PATH + "/" + fileName;
      // DBに登録
      this.objects3dRepository
        .createQueryBuilder("o3d")
        .insert()
        .into(Objects3d)
        .values([
          {
            s3Bucket: AWS_S3_OBJECT3D_BUCKET(),
            s3Key: keyPath,
            title: fileName,
            fileName: fileName,
          },
        ])
        .execute();
      const url = await this.s3Service.uploadPresignedUrlWithClient(AWS_S3_OBJECT3D_BUCKET(), keyPath);
      return { url: url };
    } catch (e) {
      this.loggerService.error(e);
      throw e;
    }
  }
  /**
   * 3dオブジェクト操作結果登録
   * @param condition 操作結果登録用情報
   * @returns 登録結果
   */
  async put3dOperation(condition) {
    try {
      // 新規登録
      if (condition.operationId === undefined) {
        // 重複チェック
        const data = await this.objects3dOperationRepository
          .createQueryBuilder("o3do")
          .select("o3do.id")
          .where("o3do.point_cloud_unique_id = :pointCloudUniqueId", { pointCloudUniqueId: condition.pointCloudUniqueId })
          .andWhere("o3do.title = :title", { title: condition.title })
          .getOne();
        if (data !== null) {
          throw new ConflictException();
        }
        // DBに登録
        await this.objects3dOperationRepository
          .createQueryBuilder()
          .insert()
          .into(Objects3dOperation)
          .values([
            {
              title: condition.title,
              pointCloudUniqueId: condition.pointCloudUniqueId,
              id3dObject: condition.object3dId,
              coordinates: condition.putCoordinates,
              xRotation: condition.xRotation,
              yRotation: condition.yRotation,
              zRotation: condition.zRotation,
              scale: condition.scale,
            },
          ])
          .execute();

        // 登録後のIDを取得
        const result = await this.objects3dOperationRepository
          .createQueryBuilder("o3do")
          .select("o3do.id")
          .where("o3do.point_cloud_unique_id = :pointCloudUniqueId", { pointCloudUniqueId: condition.pointCloudUniqueId })
          .andWhere("o3do.title = :title", { title: condition.title })
          .getOne();
        return {
          result: RESULT_SUCCESS,
          operationId: result.id,
        };
      }
      // 更新
      else {
        await this.objects3dOperationRepository
          .createQueryBuilder()
          .update(Objects3dOperation)
          .set({
            title: condition.title,
            pointCloudUniqueId: condition.pointCloudUniqueId,
            id3dObject: condition.object3dId,
            coordinates: condition.putCoordinates,
            xRotation: condition.xRotation,
            yRotation: condition.yRotation,
            zRotation: condition.zRotation,
            scale: condition.scale,
          })
          .where("id = :id", { id: condition.operationId })
          .execute();
        return {
          result: RESULT_SUCCESS,
          operationId: condition.operationId,
        };
      }
    } catch (e) {
      this.loggerService.error(e);
      throw e;
    }
  }

  /**
   * 3dオブジェクト操作結果タイトル変更
   * @param condition 変更用情報
   * @returns 変更結果
   */
  async put3dOperationTitle(condition) {
    // 更新
    try {
      // 重複チェック
      const pointCloudUniqueId = await this.objects3dOperationRepository
        .createQueryBuilder("o3do")
        .select("o3do.point_cloud_unique_id", "pointCloudUniqueId")
        .where("id = :id", { id: condition.operationId })
        .getRawOne();
      // 重複チェック
      const data = await this.objects3dOperationRepository
        .createQueryBuilder("o3do")
        .select("o3do.id")
        .where("o3do.point_cloud_unique_id = :pointCloudUniqueId", { pointCloudUniqueId: pointCloudUniqueId.pointCloudUniqueId })
        .andWhere("o3do.title = :title", { title: condition.title })
        .getOne();
      if (data !== null) {
        throw new ConflictException();
      }
      await this.objects3dOperationRepository
        .createQueryBuilder()
        .update(Objects3dOperation)
        .set({
          title: condition.title,
        })
        .where("id = :id", { id: condition.operationId })
        .execute();
      return { result: RESULT_SUCCESS };
    } catch (e) {
      this.loggerService.error(e);
      throw e;
    }
  }
  /**
   * 3dオブジェクト操作結果削除
   * @param condition 操作結果削除用情報
   * @returns 削除結果
   */
  async delete3dOperation(condition) {
    try {
      await this.objects3dOperationRepository
        .createQueryBuilder("o3do")
        .delete()
        .where("id = :id", { id: condition.operationId })
        .execute();
      return { result: RESULT_SUCCESS };
    } catch (e) {
      this.loggerService.error(e);
      throw new InternalServerErrorException();
    }
  }
}
