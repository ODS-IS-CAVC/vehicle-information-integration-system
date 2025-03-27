import { Test, TestingModule } from "@nestjs/testing";
import { ShapefileService } from "../shapefile.service";
import { S3Service } from "../s3.service";
import { LoggerService } from "../logger/logger.service";
import { MAX_ZOOM_LEVEL } from "src/consts/coordinate.const";
import { BadRequestException } from "@nestjs/common";
import axios from "axios";
import { ZFXYTile } from "src/ouranos-gex-lib/dist/zfxy";
import { readFileSync } from "fs";

describe("ShapefileService", () => {
  let service: ShapefileService;
  let s3Service: S3Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ShapefileService, S3Service, LoggerService],
    }).compile();

    service = module.get<ShapefileService>(ShapefileService);
    s3Service = module.get<S3Service>(S3Service);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("transformShapefileToVoxels", () => {
    const bucket = "test-bucket";
    const key = "test-key";
    const zoomLevel = MAX_ZOOM_LEVEL;

    it("指定されたズームレベルがMAX_ZOOM_LEVELより大きい場合はBadRequestExceptionを出す", async () => {
      const bigZoomLevel = MAX_ZOOM_LEVEL + 1;
      await expect(service.transformShapefileToVoxels(bucket, key, bigZoomLevel)).rejects.toThrow(BadRequestException);
    });

    it("ファイルサイズが10KBより大きい場合はエラーを出す", async () => {
      const s3Output = {
        Contents: [{ Size: 11 * 1024 }], //11KB
      };
      s3Service.getS3FileAttributes = jest.fn().mockReturnValueOnce(s3Output);
      await expect(service.transformShapefileToVoxels(bucket, key, zoomLevel)).rejects.toThrow("File size exceeds the 10KB limit.");
    });

    it("ZIPファイル内にdbf,shx,shp,prj拡張子の何れかのファイルがない場合はエラーを出す", async () => {
      const zoomLevel = 10;
      s3Service.getS3FileAttributes = jest.fn().mockReturnValue({ Contents: [{ Size: 1 * 1024 }] }); //1KB
      s3Service.createPresignedUrlWithClient = jest.fn().mockResolvedValue("http://fake-url");
      jest.mock("axios");
      axios.get = jest.fn().mockResolvedValueOnce({
        data: readFileSync("src/modules/util/spec/shapefile-no-shp.zip"), //shpがないファイル
      });

      await expect(service.transformShapefileToVoxels(bucket, key, zoomLevel)).rejects.toThrow(BadRequestException);
    });

    it("有効なgeoJsonに変換できなかった場合にエラーを出す", async () => {
      const zoomLevel = 10;
      s3Service.getS3FileAttributes = jest.fn().mockReturnValue({ Contents: [{ Size: 1 * 1024 }] });
      s3Service.createPresignedUrlWithClient = jest.fn().mockResolvedValue("http://fake-url");
      jest.mock("axios");
      axios.get = jest.fn().mockResolvedValue({
        data: readFileSync("src/modules/util/spec/shapefile-broken-shp.zip"), //shpが不正なファイル
      });

      await expect(service.transformShapefileToVoxels(bucket, key, zoomLevel)).rejects.toThrow(
        new Error("Failed to transform shapefile to geojson."),
      );
    });

    it("S3上のShapefile (ZIP形式) を取得して GeoJSON に変換し、空間IDを取得する", async () => {
      const zoomLevel = 10;
      s3Service.getS3FileAttributes = jest.fn().mockReturnValue({ Contents: [{ Size: 1 * 1024 }] });
      s3Service.createPresignedUrlWithClient = jest.fn().mockResolvedValue("http://fake-url");
      jest.mock("axios");
      axios.get = jest.fn().mockResolvedValue({
        data: readFileSync("src/modules/util/spec/shapefile-sample.zip"), //shp等揃っているファイル
      });
      const result: ZFXYTile[] = await service.transformShapefileToVoxels(bucket, key, zoomLevel);
      expect(result).toStrictEqual([{ f: 0, x: 909, y: 403, z: zoomLevel }]);
    });

    it("ズームレベル未指定の場合、ズームレベルがデフォルト値20の空間IDを返却する", async () => {
      s3Service.getS3FileAttributes = jest.fn().mockReturnValue({ Contents: [{ Size: 1 * 1024 }] });
      s3Service.createPresignedUrlWithClient = jest.fn().mockResolvedValue("http://fake-url");
      jest.mock("axios");
      axios.get = jest.fn().mockResolvedValue({
        data: readFileSync("src/modules/util/spec/shapefile-sample.zip"), //shp等揃っているファイル
      });
      const result: ZFXYTile[] = await service.transformShapefileToVoxels(bucket, key);

      // 空間IDが１つ以上存在し、且つズームレベルがデフォルト値（MAX_ZOOM_LEVEL）でない空間IDは存在しないことをチェック
      expect(result.length > 0).toBe(true);
      expect(result.filter((spatialId) => spatialId.z != MAX_ZOOM_LEVEL).length).toBe(0);
    });
  });
});
