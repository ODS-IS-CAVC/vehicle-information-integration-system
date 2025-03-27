import { Test, TestingModule } from "@nestjs/testing";
import { FileAttributesService } from "../file-attributes.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Lidar } from "src/entities/pointcloud/lidar.entity";
import { LoggerService } from "src/modules/util/logger/logger.service";
import { S3Service } from "src/modules/util/s3.service";
import { Logger, NotFoundException } from "@nestjs/common";

describe("FileAttributesService", () => {
  let fileAttributesService: FileAttributesService;
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
        TypeOrmModule.forFeature([Lidar]),
      ],
      providers: [FileAttributesService, LoggerService, S3Service],
    }).compile();

    fileAttributesService = module.get<FileAttributesService>(FileAttributesService);
    s3Service = module.get<S3Service>(S3Service);
  });

  afterEach(async () => {
    await module.close();
  });

  it("should be defined", () => {
    expect(fileAttributesService).toBeDefined();
  });

  describe("getFileAttributes", () => {
    it("リクエストしたファイルが『PNT_1119_202207281205_S03_02.laz』で種別が『laz』の場合、一致するファイル属性データモデルのデータが返却されること", async () => {
      // FileAttributesService.getS3FileAttributesをモックして返り値を設定
      const getS3FileAttributesMockReturnValue: any = { Contents: [{ Size: 117780006 }] };
      jest.spyOn(s3Service, "getS3FileAttributes").mockResolvedValue(getS3FileAttributesMockReturnValue);

      // 期待値　※coordinatesは中身の存在確認のみ
      const expectedValue = {
        dataModelType: "test1",
        attribute: {
          fileName: "PNT_1119_202207281205_S03_02.laz",
          type: "laz",
          size: 117780006,
          created: new Date("2024-12-19T15:42:00.000Z"),
        },
      };

      // アサーションの呼び出し確認
      expect.assertions(2);
      // 実行して結果を比較
      const result = await fileAttributesService.getFileAttributes({ fileName: "PNT_1119_202207281205_S03_02.laz" });
      // coordinatesの内容確認
      expect(result.attribute.coordinates).toBeTruthy();
      // resultからattribute.coordinatesを削除
      delete result.attribute.coordinates;
      // coordinates以外の整合性確認
      expect(result).toEqual(expectedValue);
    });

    it("リクエストしたファイルが『PNT_1119_202207281205_S09_01.laz』で種別が『potree』の場合、NotFoundExceptionがThrowされること", async () => {
      // アサーションの呼び出し確認
      expect.assertions(1);
      // 実行して結果を比較
      await expect(fileAttributesService.getFileAttributes({ fileName: "PNT_1119_202207281205_S09_01.laz" })).rejects.toThrow(
        NotFoundException,
      );
    });

    it("リクエストしたファイルに一致するデータがlidarテーブルに無い場合はNotFoundExceptionがThrowされること", async () => {
      // アサーションの呼び出し確認
      expect.assertions(1);
      // 実行して結果を比較
      await expect(fileAttributesService.getFileAttributes({ fileName: "PNT_1117_202206170814_S10_02.laz" })).rejects.toThrow(
        NotFoundException,
      );
    });

    it("リクエストしたファイルに一致するファイルがS3に存在しない場合はNotFoundExceptionがThrowされること", async () => {
      // FileAttributesService.getS3FileAttributesをモックして返り値を設定
      const getS3FileAttributesMockReturnValue: any = {};
      jest.spyOn(s3Service, "getS3FileAttributes").mockResolvedValue(getS3FileAttributesMockReturnValue);

      const spyLogger = jest.spyOn(Logger, "log");

      // アサーションの呼び出し確認
      expect.assertions(2);
      // 実行して結果を比較
      await expect(fileAttributesService.getFileAttributes({ fileName: "PNT_1119_202207281205_S03_02.laz" })).rejects.toThrow(
        NotFoundException,
      );
      // Logger.logが呼び出されたか確認
      expect(spyLogger).toHaveBeenCalledWith("S3にファイルが存在しない");
    });
  });
});
