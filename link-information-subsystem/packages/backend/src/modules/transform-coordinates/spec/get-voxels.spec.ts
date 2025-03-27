import { Test, TestingModule } from "@nestjs/testing";
import { TransformCoordinatesService } from "../transform-coordinates.service";
import { VoxelsQueryDTO } from "../dto/voxels-query.dto";
import { BadRequestException, UnprocessableEntityException } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LoggerService } from "../../util/logger/logger.service";

import { CoordinateService } from "src/modules/util/coordinate.service";
import { ZFXY_1M_ZOOM_BASE } from "src/ouranos-gex-lib/src/zfxy";
import { MergedLink } from "src/entities/sdmap/merged-link.entity";
import { EnumSet } from "src/entities/traffic/enum-set.entity";
import { PrefCity } from "src/entities/share/pref-cities.entity";
import { SchemaRelationService } from "src/modules/util/schema-relation.service";
import { SchemaRelation } from "src/entities/version/schema-relation.entity";
import { SdRoadName } from "src/entities/sdmap/road-name.entity";

describe("TransformCoordinatesService", () => {
  let transformCoordinatesService: TransformCoordinatesService;
  let loggerService: LoggerService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: "postgres",
          host: "10.71.80.38",
          port: 15432,
          username: "postgres",
          password: "postgres",
          database: "DMDB",
          autoLoadEntities: true,
        }),
        TypeOrmModule.forFeature([EnumSet, PrefCity, SchemaRelation, MergedLink, SdRoadName]),
      ],
      providers: [LoggerService, TransformCoordinatesService, SchemaRelationService, CoordinateService],
    }).compile();

    transformCoordinatesService = module.get(TransformCoordinatesService);
    loggerService = module.get<LoggerService>(LoggerService);
  });

  afterEach(async () => {
    await module.close();
  });

  it("should be defined", () => {
    expect(transformCoordinatesService).toBeDefined();
  });

  const MOCK_ZOOM_LEVEL = 15;

  let errorLog: jest.SpyInstance;
  beforeEach(async () => {
    errorLog = jest.spyOn(loggerService, "error");
  });

  describe("getVoxels", () => {
    const MOCK_BBOX_REQUEST: VoxelsQueryDTO = {
      bbox: [139.599323, 35.413816, 139.663868, 35.449484],
      mesh: undefined,
      city: undefined,
      roadName: "",
      zoomLevel: MOCK_ZOOM_LEVEL,
    };

    const MOCK_MESH_REQUEST: VoxelsQueryDTO = {
      bbox: undefined,
      mesh: 53391531,
      city: undefined,
      roadName: undefined,
      zoomLevel: MOCK_ZOOM_LEVEL,
    };

    const MOCK_CITY_REQUEST: VoxelsQueryDTO = {
      bbox: undefined,
      mesh: undefined,
      city: "14103",
      roadName: undefined,
      zoomLevel: MOCK_ZOOM_LEVEL,
    };

    it("リクエスト指定がない場合、400エラーが返却され、エラーログが出力されること。", async () => {
      await expect(() => transformCoordinatesService.getVoxels(undefined)).rejects.toThrow(BadRequestException);
      expect(errorLog).toHaveBeenCalledWith(new BadRequestException());
    });

    it("ズームレベル15を指定した場合、bboxを空間IDへ変換", async () => {
      const result = await transformCoordinatesService.getVoxels(MOCK_BBOX_REQUEST);
      expect(result).toEqual([{ f: 0, x: 1818, y: 808, z: 11 }]);
    });

    it("ズームレベル15と道路名称[石垣]を指定した場合、bboxを空間IDへ変換", async () => {
      const result = await transformCoordinatesService.getVoxels({
        ...MOCK_BBOX_REQUEST,
        bbox: [121.882324, 22.126355, 129.375, 24.1],
        roadName: "石垣",
      });
      expect(result.sort((a, b) => a.x - b.x)).toEqual([
        { x: 3456, y: 1765, z: 12, f: 0 },
        { x: 13824, y: 7061, z: 14, f: 0 },
        { x: 27649, y: 14125, z: 15, f: 0 },
        { x: 27649, y: 14125, z: 15, f: 0 },
        { x: 27649, y: 14125, z: 15, f: 0 },
        { x: 27649, y: 14125, z: 15, f: 0 },
      ]);
    });

    it("bboxと、指定した道路名称が存在しない場合、空配列が返却されること", async () => {
      const result = await transformCoordinatesService.getVoxels({ ...MOCK_BBOX_REQUEST, roadName: "テスト" });
      expect(result).toStrictEqual([]);
    });

    it("ズームレベルの指定がない場合、指定したbboxを空間IDへ変換", async () => {
      const result = await transformCoordinatesService.getVoxels({
        ...MOCK_BBOX_REQUEST,
        zoomLevel: ZFXY_1M_ZOOM_BASE,
      });
      expect(result).toEqual([{ f: 0, x: 1818, y: 808, z: 11 }]);
    });

    it("ズームレベル15を指定した場合、指定したメッシュコードを空間IDへ変換", async () => {
      const result = await transformCoordinatesService.getVoxels(MOCK_MESH_REQUEST);
      expect(result).toEqual([{ x: 7273, y: 3232, z: 13, f: 0 }]);
    });

    it("ズームレベル15と道路名称[石垣]を指定した場合、メッシュコードを空間IDへ変換", async () => {
      const result = await transformCoordinatesService.getVoxels({
        bbox: undefined,
        mesh: 3622,
        city: undefined,
        zoomLevel: 15,
        roadName: "石垣",
      });

      // 実行ごとに返却値の順番が異なるため順番を揃えるためsortしてます。
      expect(result.sort((a, b) => a.x - b.x)).toEqual([
        { x: 1723, y: 880, z: 11, f: 0 },
        { x: 6893, y: 3521, z: 13, f: 0 },
        { x: 27574, y: 14087, z: 15, f: 0 },
        { x: 27579, y: 14083, z: 15, f: 0 },
      ]);
    });

    it("メッシュコードと、指定した道路名称が存在しない場合、空配列が返却されること", async () => {
      const result = await transformCoordinatesService.getVoxels({ ...MOCK_MESH_REQUEST, roadName: "テスト" });
      expect(result).toStrictEqual([]);
    });

    it("ズームレベルと測地系指定がない場合、指定したmeshを空間IDへ変換", async () => {
      const result = await transformCoordinatesService.getVoxels({
        ...MOCK_MESH_REQUEST,
        zoomLevel: MOCK_ZOOM_LEVEL,
      });
      expect(result).toEqual([{ x: 7273, y: 3232, z: 13, f: 0 }]);
    });

    it("ズームレベル15を指定した場合、指定した行政区画コードを空間IDへ変換", async () => {
      const result = await transformCoordinatesService.getVoxels(MOCK_CITY_REQUEST);
      expect(result).toEqual([{ x: 113, y: 50, z: 7, f: 0 }]);
    });

    it("指定した行政区画コードが存在しない場合、エラーログが出力され422エラーを返すこと。", async () => {
      await expect(() => transformCoordinatesService.getVoxels({ ...MOCK_CITY_REQUEST, city: "10000" })).rejects.toThrow(
        UnprocessableEntityException,
      );
      expect(errorLog).toHaveBeenCalledWith(new UnprocessableEntityException());
    });

    it("ズームレベル15と道路名称[石垣]を指定した場合、行政区画コードを空間IDへ変換", async () => {
      const result = await transformCoordinatesService.getVoxels({ ...MOCK_CITY_REQUEST, city: "47382", roadName: "石垣" });

      expect(result).toEqual([
        { x: 27573, y: 14087, z: 15, f: 0 },
        { x: 27574, y: 14087, z: 15, f: 0 },
      ]);
    });

    it("行政区画コードと、指定した道路名称が存在しない場合、空配列が返却されること", async () => {
      const result = await transformCoordinatesService.getVoxels({ ...MOCK_CITY_REQUEST, roadName: "テスト" });
      expect(result).toStrictEqual([]);
    });

    it("ズームレベルがない場合、指定した行政区画コードを空間IDへ変換", async () => {
      const result = await transformCoordinatesService.getVoxels({
        ...MOCK_CITY_REQUEST,
        zoomLevel: ZFXY_1M_ZOOM_BASE,
      });
      expect(result).toEqual([{ x: 113, y: 50, z: 7, f: 0 }]);
    });
  });
});
