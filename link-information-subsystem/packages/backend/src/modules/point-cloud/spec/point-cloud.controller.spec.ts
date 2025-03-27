import { Test, TestingModule } from "@nestjs/testing";
import { PointCloudController } from "../point-cloud.controller";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Lidar } from "src/entities/pointcloud/lidar.entity";
import { PointCloudService } from "../point-cloud.service";
import { PointCloudSplitManage } from "src/entities/share/point-cloud-split-manage.entity";
import { Users } from "src/entities/share/users.entity";
import { CannotExecuteNotConnectedError, Repository } from "typeorm";
import { S3Service } from "src/modules/util/s3.service";
import { CoordinateService } from "src/modules/util/coordinate.service";
import { DataSource } from "typeorm";
import { plainToInstance } from "class-transformer";
import { DeletePointCloudSplitQueryDto, GetPointCloudDlUrlQueryDto, GetPointCloudListQueryDto } from "../dto/point-cloud-query.dto";
import { PutPointCloudSplitBodyDto } from "../dto/point-cloud-body.dto";
import { LoggerService } from "src/modules/util/logger/logger.service";
import { BadRequestException, InternalServerErrorException, NotFoundException, UnprocessableEntityException } from "@nestjs/common";

describe("PointCloudController", () => {
  let controller: PointCloudController;
  let service: PointCloudService;
  const mockS3Service = jest.mocked(S3Service);
  const mockCoordinateService = jest.mocked(CoordinateService);
  const mockDataSource = jest.mocked(DataSource);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PointCloudController],
      providers: [
        PointCloudService,
        LoggerService,
        {
          provide: getRepositoryToken(Lidar),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(PointCloudSplitManage),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Users),
          useClass: Repository,
        },
        {
          provide: S3Service,
          useValue: mockS3Service,
        },
        {
          provide: CoordinateService,
          useValue: mockCoordinateService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    controller = module.get<PointCloudController>(PointCloudController);
    service = module.get<PointCloudService>(PointCloudService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("pointCloudList", () => {
    it("serviceのgetPointcloudList関数が指定のリクエスト内容で呼び出されること", async () => {
      const queryDto = plainToInstance(GetPointCloudListQueryDto, { bbox: "139.681994465,35.50676814,139.681985082,35.506773265" });
      const returnValue: any = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "MultiLineString",
              crs: {
                type: "name",
                properties: {
                  name: "EPSG:6697",
                },
              },
              coordinates: [
                [
                  [139.754000191, 36.436697089, 71.068],
                  [139.754143545, 36.437263786, 71.385],
                ],
              ],
            },
            properties: {
              pointCloudUniqueId: 15,
              tags: null,
              url: "s3://3dmp-data-jp-production/lidar/gen2-highway/SD_1117_202208240811_S06_01/v1/6676/metadata.json",
              sceneName: "SD_1117_202208240811_S06_01",
              acquisitionDate: "2022-08-23T15:00:00.000Z",
            },
          },
        ],
      };
      const spyGetPointcloudList = jest.spyOn(service, "getPointcloudList").mockReturnValue(returnValue);
      await controller.getPointcloudList(queryDto);
      expect(spyGetPointcloudList).toHaveBeenCalledWith(queryDto);
    });

    it("パスパラメータの指定がない場合はBadRequestExceptionがThrowされること", async () => {
      const queryEmptyDto = plainToInstance(GetPointCloudListQueryDto, {});

      const spyGetPointcloudListBadRequest = jest.spyOn(service, "getPointcloudList").mockImplementation(() => {
        throw new BadRequestException();
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.getPointcloudList(queryEmptyDto)).rejects.toThrow(BadRequestException);
      // serviceのgetPointcloudListが呼ばれることの確認
      expect(spyGetPointcloudListBadRequest).toHaveBeenCalledWith(queryEmptyDto);
    });

    it("パスパラメータの指定がない場合はBadRequestExceptionがThrowされること", async () => {
      const queryEmptyDto = plainToInstance(GetPointCloudListQueryDto, {});

      const spyGetPointcloudListBadRequest = jest.spyOn(service, "getPointcloudList").mockImplementation(() => {
        throw new BadRequestException();
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.getPointcloudList(queryEmptyDto)).rejects.toThrow(BadRequestException);
      // serviceのgetPointcloudListが呼ばれることの確認
      expect(spyGetPointcloudListBadRequest).toHaveBeenCalledWith(queryEmptyDto);
    });

    it("指定した行政区画コードが存在しない場合はUnprocessableEntityExceptionがThrowされること", async () => {
      const queryCityDto = plainToInstance(GetPointCloudListQueryDto, { city: "40000" });

      const spyGetPointcloudListUnprocessableEntity = jest.spyOn(service, "getPointcloudList").mockImplementation(() => {
        throw new UnprocessableEntityException();
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.getPointcloudList(queryCityDto)).rejects.toThrow(UnprocessableEntityException);
      // serviceのgetPointcloudListが呼ばれることの確認
      expect(spyGetPointcloudListUnprocessableEntity).toHaveBeenCalledWith(queryCityDto);
    });

    it("DB接続が失敗した場合はInternalServerErrorExceptionがThrowされること", async () => {
      const queryDto = plainToInstance(GetPointCloudListQueryDto, { bbox: "139.681994465,35.50676814,139.681985082,35.506773265" });

      const spyGetPointcloudListNotConnected = jest.spyOn(service, "getPointcloudList").mockImplementation(() => {
        throw new CannotExecuteNotConnectedError("DB接続エラー");
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.getPointcloudList(queryDto)).rejects.toThrow(InternalServerErrorException);
      // serviceのgetPointcloudListが呼ばれることの確認
      expect(spyGetPointcloudListNotConnected).toHaveBeenCalledWith(queryDto);
    });
  });

  describe("pointCloudSplitStatus", () => {
    it("serviceのgetPointcloudSplitStatus関数が指定のリクエスト内容で呼び出されること", async () => {
      const queryDto = plainToInstance(Users, { id: "1" });
      const mockReturnValue = {
        splitStatusList: [
          {
            requestId: 1,
            requestDate: "2024-11-11T13:34:00.000",
            pointCloudSceneName: "pointCloudSceneName",
            status: 1,
          },
        ],
      };
      const spyGetPointcloudSplitStatus = jest.spyOn(service, "getPointcloudSplitStatus").mockReturnValue(Promise.resolve(mockReturnValue));
      await controller.getPointcloudSplitStatus(queryDto);
      expect(spyGetPointcloudSplitStatus).toHaveBeenCalledWith(queryDto);
    });

    it("DB接続が失敗した場合はInternalServerErrorExceptionがThrowされること", async () => {
      const queryDto = plainToInstance(Users, { id: "1" });

      const spyGetPointcloudSplitStatusNotConnected = jest.spyOn(service, "getPointcloudSplitStatus").mockImplementation(() => {
        throw new CannotExecuteNotConnectedError("DB接続エラー");
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.getPointcloudSplitStatus(queryDto)).rejects.toThrow(InternalServerErrorException);
      // serviceのgetPointcloudSplitStatusが呼ばれることの確認
      expect(spyGetPointcloudSplitStatusNotConnected).toHaveBeenCalledWith(queryDto);
    });
  });

  describe("pointCloudDlUrl", () => {
    it("serviceのgetPointcloudDlUrl関数が指定のリクエスト内容で呼び出されること", async () => {
      const queryDto = plainToInstance(GetPointCloudDlUrlQueryDto, { requestId: "1" });
      const spyGetPointcloudDlUrl = jest.spyOn(service, "getPointcloudDlUrl").mockReturnValue(Promise.resolve({ url: "" }));
      await controller.getPointcloudDlUrl(queryDto);
      expect(spyGetPointcloudDlUrl).toHaveBeenCalledWith(queryDto);
    });

    it("requestIdと一致するデータが点群データ分割管理テーブルに無い場合はNotFoundExceptionがThrowされること", async () => {
      const queryDto = plainToInstance(GetPointCloudDlUrlQueryDto, { requestId: "10000" });

      const spyGetPointcloudDlUrlNotFound = jest.spyOn(service, "getPointcloudDlUrl").mockImplementation(() => {
        throw new NotFoundException();
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.getPointcloudDlUrl(queryDto)).rejects.toThrow(NotFoundException);
      // serviceのgetPointcloudDlUrlが呼ばれることの確認
      expect(spyGetPointcloudDlUrlNotFound).toHaveBeenCalledWith(queryDto);
    });

    it("DB接続が失敗した場合はInternalServerErrorExceptionがThrowされること", async () => {
      const queryDto = plainToInstance(GetPointCloudDlUrlQueryDto, { requestId: "1" });

      const spyGetPointcloudDlUrlNotConnected = jest.spyOn(service, "getPointcloudDlUrl").mockImplementation(() => {
        throw new CannotExecuteNotConnectedError("DB接続エラー");
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.getPointcloudDlUrl(queryDto)).rejects.toThrow(InternalServerErrorException);
      // serviceのgetPointcloudDlUrlが呼ばれることの確認
      expect(spyGetPointcloudDlUrlNotConnected).toHaveBeenCalledWith(queryDto);
    });
  });

  describe("pointCloudSplit", () => {
    it("serviceのputPointCloudSplit関数が指定のリクエスト内容で呼び出されること", async () => {
      const bodyDto = plainToInstance(PutPointCloudSplitBodyDto, {
        startPoint: { lat: 30, lon: 30 },
        endPoint: { lat: 30, lon: 30 },
        pointCloudUniqueId: 1,
      });
      const userDto = plainToInstance(Users, { id: "1" });
      const spyPutPointCloudSplit = jest.spyOn(service, "putPointCloudSplit").mockReturnValue(Promise.resolve({ result: "success" }));
      await controller.putPointCloudSplit(bodyDto, userDto);
      expect(spyPutPointCloudSplit).toHaveBeenCalledWith(bodyDto, userDto);
    });

    it("緯度:『-90<lat<90』、経度:『-180<lon<180』の範囲で指定されていない場合はBadRequestExceptionがThrowされること", async () => {
      const bodyDto = plainToInstance(PutPointCloudSplitBodyDto, {
        startPoint: { lat: 30, lon: 181 },
        endPoint: { lat: 30, lon: 30 },
        pointCloudUniqueId: 1,
      });
      const userDto = plainToInstance(Users, { id: "1" });

      const spyPutPointCloudSplitBadRequest = jest.spyOn(service, "putPointCloudSplit").mockImplementation(() => {
        throw new BadRequestException();
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.putPointCloudSplit(bodyDto, userDto)).rejects.toThrow(BadRequestException);
      // serviceのputPointCloudSplitが呼ばれることの確認
      expect(spyPutPointCloudSplitBadRequest).toHaveBeenCalledWith(bodyDto, userDto);
    });

    it("pointCloudUniqueIdと一致するデータがlidarテーブルに無い場合はNotFoundExceptionがThrowされること", async () => {
      const bodyDto = plainToInstance(PutPointCloudSplitBodyDto, {
        startPoint: { lat: 30, lon: 30 },
        endPoint: { lat: 30, lon: 30 },
        pointCloudUniqueId: 10000,
      });
      const userDto = plainToInstance(Users, { id: "1" });

      const spyPutPointCloudSplitNotFound = jest.spyOn(service, "putPointCloudSplit").mockImplementation(() => {
        throw new NotFoundException();
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.putPointCloudSplit(bodyDto, userDto)).rejects.toThrow(NotFoundException);
      // serviceのputPointCloudSplitが呼ばれることの確認
      expect(spyPutPointCloudSplitNotFound).toHaveBeenCalledWith(bodyDto, userDto);
    });

    it("DB接続が失敗した場合はInternalServerErrorExceptionがThrowされること", async () => {
      const bodyDto = plainToInstance(PutPointCloudSplitBodyDto, {
        startPoint: { lat: 30, lon: 30 },
        endPoint: { lat: 30, lon: 30 },
        pointCloudUniqueId: 1,
      });
      const userDto = plainToInstance(Users, { id: "1" });

      const spyPutPointCloudSplitNotConnected = jest.spyOn(service, "putPointCloudSplit").mockImplementation(() => {
        throw new CannotExecuteNotConnectedError("DB接続エラー");
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.putPointCloudSplit(bodyDto, userDto)).rejects.toThrow(InternalServerErrorException);
      // serviceのputPointCloudSplitが呼ばれることの確認
      expect(spyPutPointCloudSplitNotConnected).toHaveBeenCalledWith(bodyDto, userDto);
    });
  });

  describe("pointCloudSplitFile", () => {
    it("serviceのdeletePointcloudSplitFile関数が指定のリクエスト内容で呼び出されること", async () => {
      const bodyDto = plainToInstance(DeletePointCloudSplitQueryDto, {
        requestId: 1,
      });
      const spyDeletePointcloudSplitFile = jest
        .spyOn(service, "deletePointcloudSplitFile")
        .mockReturnValue(Promise.resolve({ result: "success" }));
      await controller.deletePointcloudSplitFile(bodyDto);
      expect(spyDeletePointcloudSplitFile).toHaveBeenCalledWith(bodyDto);
    });

    it("requestIdと一致するデータが点群データ分割管理テーブルに無い場合はNotFoundExceptionがThrowされること", async () => {
      const bodyDto = plainToInstance(DeletePointCloudSplitQueryDto, {
        requestId: 100000,
      });

      const spyDeletePointcloudSplitFileNotFound = jest.spyOn(service, "deletePointcloudSplitFile").mockImplementation(() => {
        throw new NotFoundException();
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.deletePointcloudSplitFile(bodyDto)).rejects.toThrow(NotFoundException);
      // serviceのdeletePointcloudSplitFileが呼ばれることの確認
      expect(spyDeletePointcloudSplitFileNotFound).toHaveBeenCalledWith(bodyDto);
    });

    it("DB接続が失敗した場合はInternalServerErrorExceptionがThrowされること", async () => {
      const bodyDto = plainToInstance(DeletePointCloudSplitQueryDto, {
        requestId: 1,
      });

      const spyDeletePointcloudSplitFileNotConnected = jest.spyOn(service, "deletePointcloudSplitFile").mockImplementation(() => {
        throw new CannotExecuteNotConnectedError("DB接続エラー");
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.deletePointcloudSplitFile(bodyDto)).rejects.toThrow(InternalServerErrorException);
      // serviceのdeletePointcloudSplitFileが呼ばれることの確認
      expect(spyDeletePointcloudSplitFileNotConnected).toHaveBeenCalledWith(bodyDto);
    });
  });
});
