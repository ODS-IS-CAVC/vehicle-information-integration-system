import { Test, TestingModule } from "@nestjs/testing";
import { PointCloudService } from "../point-cloud.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PointCloudSplitManage } from "src/entities/share/point-cloud-split-manage.entity";
import { Lidar } from "src/entities/pointcloud/lidar.entity";
import { Users } from "src/entities/share/users.entity";
import { plainToInstance } from "class-transformer";
import { DeletePointCloudSplitQueryDto, GetPointCloudDlUrlQueryDto, GetPointCloudListQueryDto } from "../dto/point-cloud-query.dto";
import { UtilModule } from "src/modules/util/util.module";
import { BadRequestException, NotFoundException, UnprocessableEntityException } from "@nestjs/common";
import { LoggerService } from "src/modules/util/logger/logger.service";
import { S3Service } from "src/modules/util/s3.service";
import { PutPointCloudSplitBodyDto } from "../dto/point-cloud-body.dto";
import { createDb, resetDb } from "./point-cloud-db-reset/db-reset";

describe("PointCloudService", () => {
  beforeAll(async () => {
    await createDb();
  });

  afterAll(async () => {
    await resetDb();
  });

  let service: PointCloudService;
  let s3Service: S3Service;
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
        TypeOrmModule.forFeature([Lidar, PointCloudSplitManage, Users]),
        UtilModule,
      ],
      providers: [PointCloudService, LoggerService],
    }).compile();

    service = module.get<PointCloudService>(PointCloudService);
    s3Service = module.get<S3Service>(S3Service);
  });

  afterEach(async () => {
    await module.close();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getPointCloudList", () => {
    it("リクエスト内容がポイント指定の場合で、緯度のみが指定された場合、400: BadRequestが返却されること", async () => {
      const queryDto = plainToInstance(GetPointCloudListQueryDto, { lat: 30.68199 });
      await expect(service.getPointcloudList(queryDto)).rejects.toThrow(BadRequestException);
    });

    it("リクエスト内容がポイント指定の場合で、経度のみが指定された場合、400: BadRequestが返却されること", async () => {
      const queryDto = plainToInstance(GetPointCloudListQueryDto, { lon: 130.68199 });
      await expect(service.getPointcloudList(queryDto)).rejects.toThrow(BadRequestException);
    });

    it("リクエスト内容がポイント指定の場合で、緯度が範囲外の値で指定された場合、400: BadRequestが返却されること", async () => {
      const queryDto = plainToInstance(GetPointCloudListQueryDto, { lat: 90.68199, lon: 130.68199 });
      await expect(service.getPointcloudList(queryDto)).rejects.toThrow(BadRequestException);
    });

    it("リクエスト内容がポイント指定の場合で、緯度が範囲外の値で指定された場合、400: BadRequestが返却されること", async () => {
      const queryDto = plainToInstance(GetPointCloudListQueryDto, { lat: -90.68199, lon: 130.68199 });
      await expect(service.getPointcloudList(queryDto)).rejects.toThrow(BadRequestException);
    });

    it("リクエスト内容がポイント指定の場合で、経度が範囲外の値で指定された場合、400: BadRequestが返却されること", async () => {
      const queryDto = plainToInstance(GetPointCloudListQueryDto, { lat: 30.68199, lon: 180.68199 });
      await expect(service.getPointcloudList(queryDto)).rejects.toThrow(BadRequestException);
    });

    it("リクエスト内容がポイント指定の場合で、経度が範囲外の値で指定された場合、400: BadRequestが返却されること", async () => {
      const queryDto = plainToInstance(GetPointCloudListQueryDto, { lat: 30.68199, lon: -180.68199 });
      await expect(service.getPointcloudList(queryDto)).rejects.toThrow(BadRequestException);
    });

    it("リクエスト内容がポイント指定の場合で、検索結果が0件の場合、空配列（features）が返却されること", async () => {
      const queryDto = plainToInstance(GetPointCloudListQueryDto, { lat: 30.436697189, lon: 170.754010191 });
      const result = await service.getPointcloudList(queryDto);
      expect(result).toEqual({
        type: "FeatureCollection",
        features: [],
      });
    });

    it("リクエスト内容がポイント指定の場合で、正常に値が取得できること", async () => {
      const queryDto = plainToInstance(GetPointCloudListQueryDto, { lat: 36.436697088579, lon: 139.754000191444 });
      const result = await service.getPointcloudList(queryDto);
      expect(result).not.toBe("");
      expect(result.features.length).not.toBe(0);
    });

    it("リクエスト内容がbbox指定の場合で、正常に値が取得できること", async () => {
      const queryDto = plainToInstance(GetPointCloudListQueryDto, { bbox: "130,30,140,40" });
      const result = await service.getPointcloudList(queryDto);
      expect(result).not.toBe("");
      expect(result.features.length).not.toBe(0);
    });

    it("リクエスト内容がbbox指定の場合で、検索結果が0件の場合、空配列（features）が返却されること", async () => {
      const queryDto = plainToInstance(GetPointCloudListQueryDto, { bbox: "140,50,141,51" });
      const result = await service.getPointcloudList(queryDto);
      expect(result).toEqual({
        type: "FeatureCollection",
        features: [],
      });
    });

    it("リクエスト内容がcity指定の場合で、正常に値が取得できること", async () => {
      const queryDto = plainToInstance(GetPointCloudListQueryDto, { city: "09203" });
      const result = await service.getPointcloudList(queryDto);
      expect(result).not.toBe("");
      expect(result.features.length).not.toBe(0);
    });

    it("リクエスト内容がcity指定の場合で、検索結果が0件の場合、空配列（features）が返却されること", async () => {
      const queryDto = plainToInstance(GetPointCloudListQueryDto, { city: "11101" });
      const result = await service.getPointcloudList(queryDto);
      expect(result).toEqual({
        type: "FeatureCollection",
        features: [],
      });
    });

    it("リクエスト内容がmesh指定の場合で、正常に値が取得できること", async () => {
      const queryDto = plainToInstance(GetPointCloudListQueryDto, { mesh: "5439" });
      const result = await service.getPointcloudList(queryDto);
      expect(result).not.toBe("");
      expect(result.features.length).not.toBe(0);
    });

    it("リクエスト内容がmesh指定の場合で、検索結果が0件の場合、空配列（features）が返却されること", async () => {
      const queryDto = plainToInstance(GetPointCloudListQueryDto, { mesh: "5339" });
      const result = await service.getPointcloudList(queryDto);
      expect(result).toEqual({
        type: "FeatureCollection",
        features: [],
      });
    });

    it("リクエスト内容が存在しないcity指定の場合、422: UnprocessableEntityが返却されること", async () => {
      const queryDto = plainToInstance(GetPointCloudListQueryDto, { city: "40000" });
      await expect(service.getPointcloudList(queryDto)).rejects.toThrow(UnprocessableEntityException);
    });

    it("リクエスト指定がない場合、400: BadRequestが返却されること", async () => {
      const queryDto = plainToInstance(GetPointCloudListQueryDto, undefined);
      await expect(service.getPointcloudList(queryDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe("getPointcloudSplitStatus", () => {
    it("リクエストのユーザーID指定で点群分割申請が存在しない場合、空配列が返却されること", async () => {
      const queryDto = plainToInstance(Users, { id: 1 });
      const result = await service.getPointcloudSplitStatus(queryDto);
      expect(result).toEqual({ splitStatusList: [] });
    });

    it("リクエストのユーザーID指定で点群分割申請が存在する場合、正常に値が返却されること", async () => {
      const queryDto = plainToInstance(Users, { id: 10 });
      const result = await service.getPointcloudSplitStatus(queryDto);
      expect(result.splitStatusList.length).not.toBe(0);
    });
  });

  describe("getPointcloudDlUrl", () => {
    it("リクエストの申請ID指定で該当する分割申請が存在しない場合、404: NotFoundが返却されること", async () => {
      const queryDto = plainToInstance(GetPointCloudDlUrlQueryDto, { requestId: 1 });
      await expect(service.getPointcloudDlUrl(queryDto)).rejects.toThrow(NotFoundException);
    });

    it("リクエストの申請ID指定で該当する分割申請が存在する場合、ダウンロード用URLが返却されること", async () => {
      const queryDto = plainToInstance(GetPointCloudDlUrlQueryDto, { requestId: 162 });
      jest.spyOn(s3Service, "createPresignedUrlWithClient").mockReturnValue(Promise.resolve("https://test.co.jp"));
      const result = await service.getPointcloudDlUrl(queryDto);
      expect(result.url).not.toBe("");
    });
  });

  describe("putPointCloudSplit", () => {
    it("リクエストの緯度(始点)が範囲外の場合、400: BadRequestが返却されること", async () => {
      const bodyDto = plainToInstance(PutPointCloudSplitBodyDto, {
        startPoint: { lat: 90.123456789, lon: 130.123456789 },
        endPoint: { lat: 31.123456789, lon: 131.123456789 },
        pointCloudUniqueId: 1,
      });
      const userDto = plainToInstance(Users, { id: 10 });
      await expect(service.putPointCloudSplit(bodyDto, userDto)).rejects.toThrow(BadRequestException);

      const bodyDto2 = plainToInstance(PutPointCloudSplitBodyDto, {
        startPoint: { lat: -90.123456789, lon: 130.123456789 },
        endPoint: { lat: 31.123456789, lon: 131.123456789 },
        pointCloudUniqueId: 1,
      });
      await expect(service.putPointCloudSplit(bodyDto2, userDto)).rejects.toThrow(BadRequestException);
    });

    it("リクエストの緯度(終点)が範囲外の場合、400: BadRequestが返却されること", async () => {
      const bodyDto = plainToInstance(PutPointCloudSplitBodyDto, {
        startPoint: { lat: 30.123456789, lon: 130.123456789 },
        endPoint: { lat: 91.123456789, lon: 131.123456789 },
        pointCloudUniqueId: 1,
      });
      const userDto = plainToInstance(Users, { id: 10 });
      await expect(service.putPointCloudSplit(bodyDto, userDto)).rejects.toThrow(BadRequestException);

      const bodyDto2 = plainToInstance(PutPointCloudSplitBodyDto, {
        startPoint: { lat: 30.123456789, lon: 130.123456789 },
        endPoint: { lat: -91.123456789, lon: 131.123456789 },
        pointCloudUniqueId: 1,
      });
      await expect(service.putPointCloudSplit(bodyDto2, userDto)).rejects.toThrow(BadRequestException);
    });

    it("リクエストの経度(始点)が範囲外の場合、400: BadRequestが返却されること", async () => {
      const bodyDto = plainToInstance(PutPointCloudSplitBodyDto, {
        startPoint: { lat: 30.123456789, lon: 180.123456789 },
        endPoint: { lat: 31.123456789, lon: 131.123456789 },
        pointCloudUniqueId: 1,
      });
      const userDto = plainToInstance(Users, { id: 10 });
      await expect(service.putPointCloudSplit(bodyDto, userDto)).rejects.toThrow(BadRequestException);

      const bodyDto2 = plainToInstance(PutPointCloudSplitBodyDto, {
        startPoint: { lat: 30.123456789, lon: -180.123456789 },
        endPoint: { lat: 31.123456789, lon: 131.123456789 },
        pointCloudUniqueId: 1,
      });
      await expect(service.putPointCloudSplit(bodyDto2, userDto)).rejects.toThrow(BadRequestException);
    });

    it("リクエストの経度(終点)が範囲外の場合、400: BadRequestが返却されること", async () => {
      const bodyDto = plainToInstance(PutPointCloudSplitBodyDto, {
        startPoint: { lat: 30.123456789, lon: 130.123456789 },
        endPoint: { lat: 31.123456789, lon: 181.123456789 },
        pointCloudUniqueId: 1,
      });
      const userDto = plainToInstance(Users, { id: 10 });
      await expect(service.putPointCloudSplit(bodyDto, userDto)).rejects.toThrow(BadRequestException);

      const bodyDto2 = plainToInstance(PutPointCloudSplitBodyDto, {
        startPoint: { lat: 30.123456789, lon: 130.123456789 },
        endPoint: { lat: 31.123456789, lon: -181.123456789 },
        pointCloudUniqueId: 1,
      });
      await expect(service.putPointCloudSplit(bodyDto2, userDto)).rejects.toThrow(BadRequestException);
    });

    it("リクエストのpointCloudUniqueIdがlidarテーブルに存在しない場合、404: NotFoundが返却されること", async () => {
      const bodyDto = plainToInstance(PutPointCloudSplitBodyDto, {
        startPoint: { lat: 30.123456789, lon: 130.123456789 },
        endPoint: { lat: 31.123456789, lon: 131.123456789 },
        pointCloudUniqueId: 100,
      });
      const userDto = plainToInstance(Users, { id: 10 });
      await expect(service.putPointCloudSplit(bodyDto, userDto)).rejects.toThrow(NotFoundException);
    });

    it("リクエストのpointCloudUniqueId以外に、同じorig_laz_pathを持つ他の点群データが存在しない場合、404: NotFoundが返却されること", async () => {
      const bodyDto = plainToInstance(PutPointCloudSplitBodyDto, {
        startPoint: { lat: 30.123456789, lon: 130.123456789 },
        endPoint: { lat: 31.123456789, lon: 131.123456789 },
        pointCloudUniqueId: 2,
      });
      const userDto = plainToInstance(Users, { id: 10 });
      await expect(service.putPointCloudSplit(bodyDto, userDto)).rejects.toThrow(NotFoundException);
    });

    it("分割申請が正常に登録されること", async () => {
      const bodyDto = plainToInstance(PutPointCloudSplitBodyDto, {
        startPoint: { lat: 30.123456789, lon: 130.123456789 },
        endPoint: { lat: 31.123456789, lon: 131.123456789 },
        pointCloudUniqueId: 1,
      });
      const userDto = plainToInstance(Users, { id: 10 });
      const result = await service.putPointCloudSplit(bodyDto, userDto);
      expect(result.result).toBe("SUCCESS");
    });
  });

  describe("deletePointcloudSplitFile", () => {
    it("リクエストの申請ID指定で該当する分割申請が存在しない場合、404: NotFoundが返却されること", async () => {
      const queryDto = plainToInstance(DeletePointCloudSplitQueryDto, { requestId: -1 });
      const s3deleteResult: any = { DeleteMarker: true };
      jest.spyOn(s3Service, "s3Delete").mockReturnValue(Promise.resolve(s3deleteResult));
      await expect(service.deletePointcloudSplitFile(queryDto)).rejects.toThrow(NotFoundException);
    });

    it("リクエストの申請ID指定で該当する分割申請が存在する場合、正常に値が返却されること", async () => {
      const queryDto = plainToInstance(DeletePointCloudSplitQueryDto, { requestId: 0 });
      const s3deleteResult: any = { DeleteMarker: true };
      jest.spyOn(s3Service, "s3Delete").mockReturnValue(Promise.resolve(s3deleteResult));
      const result = await service.deletePointcloudSplitFile(queryDto);
      expect(result.result).toBe("SUCCESS");
    });
  });
});
