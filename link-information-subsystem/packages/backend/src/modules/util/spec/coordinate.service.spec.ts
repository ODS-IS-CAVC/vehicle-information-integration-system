import { Test, TestingModule } from "@nestjs/testing";
import { CoordinateService } from "../coordinate.service";
import { SchemaRelation } from "src/entities/version/schema-relation.entity";
import { getRepositoryToken } from "@nestjs/typeorm";
import { EnumSet } from "src/entities/traffic/enum-set.entity";
import { MergedLink } from "src/entities/sdmap/merged-link.entity";
import { CannotExecuteNotConnectedError, Repository } from "typeorm";
import { BadRequestException } from "@nestjs/common/exceptions";
import { SchemaRelationService } from "../schema-relation.service";
import { GEODETIC, Geodetic } from "src/shares/lib/proj4";
import { Space } from "ouranos-gex-lib-for-javascript/src";
import {
  MOCK_POINT,
  MOCK_POINTS,
  MOCK_LINE,
  MOCK_LINES,
  MOCK_POLYGON,
  MOCK_POLYGONS,
  MOCK_POINT_SPACE_IDS,
  MOCK_MESHCODE,
} from "./coordinate.service.mock-data";
import { ZFXY_1M_ZOOM_BASE } from "src/ouranos-gex-lib/src/zfxy";
import { MAX_ZOOM_LEVEL } from "src/consts/coordinate.const";
import dayjs from "dayjs";
import { LoggerService } from "../logger/logger.service";

describe("CoordinateService", () => {
  let coordinateService: CoordinateService;
  let loggerService: LoggerService;
  let schemaRelationRepository: Repository<SchemaRelation>;
  let enumSetRepository: Repository<EnumSet>;
  let mergedLinkRepository: Repository<MergedLink>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoordinateService,
        LoggerService,
        SchemaRelationService,
        {
          provide: getRepositoryToken(SchemaRelation),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(EnumSet),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(MergedLink),
          useClass: Repository,
        },
      ],
    }).compile();

    coordinateService = module.get<CoordinateService>(CoordinateService);
    loggerService = module.get<LoggerService>(LoggerService);
    schemaRelationRepository = module.get<Repository<SchemaRelation>>(getRepositoryToken(SchemaRelation));
    enumSetRepository = module.get<Repository<EnumSet>>(getRepositoryToken(EnumSet));
    mergedLinkRepository = module.get<Repository<MergedLink>>(getRepositoryToken(MergedLink));
  });

  it("should be defined", () => {
    expect(coordinateService).toBeDefined();
  });

  describe("getSurroundingVoxels", () => {
    it("空間IDを『{ lat: 35.689, lng: 139.692 } を zoomlevel:25 』として作成した場合に周辺空間ID(上下・東西南北)が返却されること", () => {
      // モックデータの設定(Point)
      const { lat, lon: lng } = MOCK_POINT[0];
      const mockPoint = { lat, lng };
      const space = new Space(mockPoint, 25);

      // 期待値
      const expectedValue = [
        { z: 25, f: 1, x: 29797454, y: 13212106 },
        { z: 25, f: -1, x: 29797454, y: 13212106 },
        { z: 25, f: 0, x: 29797455, y: 13212106 },
        { z: 25, f: 0, x: 29797453, y: 13212106 },
        { z: 25, f: 0, x: 29797454, y: 13212105 },
        { z: 25, f: 0, x: 29797454, y: 13212107 },
      ];

      // 実行して結果を比較
      const result = coordinateService["getSurroundingVoxels"](space);
      expect(result).toEqual(expectedValue);
    });
  });

  describe("getTransformedCoordinate", () => {
    it("POINTが『1つ』の場合に『EPSG6668』に変換された座標が返却されること", () => {
      // 実行して結果を比較
      const result = coordinateService["getTransformedCoordinate"](MOCK_POINT, GEODETIC.EPSG6668);
      expect(result).toEqual(MOCK_POINT);
    });

    it("POINTが『1つ』の場合に『EPSG4326』に変換された座標が返却されること", () => {
      // 実行して結果を比較
      const result = coordinateService["getTransformedCoordinate"](MOCK_POINTS, GEODETIC.EPSG4326);
      expect(result).toEqual(MOCK_POINTS);
    });

    it("GEODETICが『オブジェクトに登録されていない』場合はLoggerService.errorが呼び出されエラーがスローされること", () => {
      const spyLoggerService = jest.spyOn(loggerService, "error");

      // 実行して結果を比較
      expect(() => coordinateService["getTransformedCoordinate"](MOCK_POINT, "EPSG7777" as unknown as Geodetic)).toThrow();
      // LoggerService.errorが呼び出されたか確認
      expect(spyLoggerService).toHaveBeenCalledWith("Could not parse to valid json: EPSG7777");
    });
  });

  describe("transformCoordinates", () => {
    it("POINTが『複数』の場合に『EPSG4326』に変換された座標が返却されること", () => {
      // 実行して結果を比較
      const result = coordinateService.transformCoordinates(GEODETIC.EPSG6668, GEODETIC.EPSG4326, MOCK_POINTS);
      expect(result).toEqual(MOCK_POINTS);
    });
  });

  describe("transformLineToVoxels", () => {
    it("LINEが『1つ』の場合に『EPSG6668』に変換された座標に対する『zoomlevel: 25』の空間IDが返却されること", () => {
      // 期待値
      const expectedValue = [
        [
          { f: 0, x: 29696095, y: 13270977, z: 25 },
          { f: 0, x: 29696116, y: 13270952, z: 25 },
          { f: 0, x: 29696145, y: 13270914, z: 25 },
        ],
      ];

      // 実行して結果を比較
      const result = coordinateService.transformLineToVoxels(MOCK_LINE, 25, GEODETIC.EPSG6668);
      expect(result).toEqual(expectedValue);
    });

    it("LINEが『複数』の場合に『EPSG4326』に変換された座標に対する『zoomlevel: 30』の空間IDが返却されること", () => {
      // 期待値
      const expectedValue = [
        [
          { f: 0, x: 950275043, y: 424671277, z: 30 },
          { f: 0, x: 950275720, y: 424670471, z: 30 },
          { f: 0, x: 950276671, y: 424669271, z: 30 },
        ],
        [
          { f: 0, x: 950310942, y: 424752195, z: 30 },
          { f: 0, x: 950311294, y: 424751174, z: 30 },
          { f: 0, x: 950311786, y: 424749634, z: 30 },
        ],
      ];

      // 実行して結果を比較
      const result = coordinateService.transformLineToVoxels(MOCK_LINES, 30, GEODETIC.EPSG4326);
      expect(result).toEqual(expectedValue);
    });

    it("LINEが『空配列』の場合に空配列が返却されること", () => {
      // 実行して結果を比較
      const result = coordinateService.transformLineToVoxels([], 30, GEODETIC.EPSG6668);
      // 期待値 → 空配列
      expect(result).toEqual([]);
    });

    it("LINEが『1つ』の場合に『EPSG6668』に変換された座標に対する『zoomlevel: 25(undefined入力)』の空間IDが返却されること", () => {
      // 期待値(zoomlevel → デフォルト値)
      const expectedValue = [
        [
          { f: 0, x: 29696095, y: 13270977, z: ZFXY_1M_ZOOM_BASE },
          { f: 0, x: 29696116, y: 13270952, z: ZFXY_1M_ZOOM_BASE },
          { f: 0, x: 29696145, y: 13270914, z: ZFXY_1M_ZOOM_BASE },
        ],
      ];

      // 実行して結果を比較
      const result = coordinateService.transformLineToVoxels(MOCK_LINE, undefined, GEODETIC.EPSG6668);
      expect(result).toEqual(expectedValue);
    });

    it("LINEが『1つ』の場合に『EPSG6668(undefined入力)』に変換された座標に対する『zoomlevel: 30』の空間IDが返却されること", () => {
      // 期待値
      const expectedValue = [
        [
          { f: 0, x: 950275043, y: 424671277, z: 30 },
          { f: 0, x: 950275720, y: 424670471, z: 30 },
          { f: 0, x: 950276671, y: 424669271, z: 30 },
        ],
      ];

      // 実行して結果を比較
      const result = coordinateService.transformLineToVoxels(MOCK_LINE, 30, undefined);
      expect(result).toEqual(expectedValue);
    });
  });

  describe("transformPointToVoxels", () => {
    it("PONITが『1つ』の場合に『EPSG6668』に変換された座標に対する『zoomlevel: 25』の空間IDが返却されること", () => {
      // 期待値
      const expectedValue = [{ f: 0, x: 29797454, y: 13212106, z: 25 }];

      // 実行して結果を比較
      const result = coordinateService.transformPointToVoxels(MOCK_POINT, 25, GEODETIC.EPSG6668);
      expect(result).toEqual(expectedValue);
    });

    it("POINTが『複数』の場合に『EPSG4326』に変換された座標に対する『zoomlevel: 30』の空間IDが返却されること", () => {
      // 期待値
      const expectedValue = [
        { f: 0, x: 953518531, y: 422787405, z: 30 },
        { f: 0, x: 941075056, y: 426447931, z: 30 },
      ];

      // 実行して結果を比較
      const result = coordinateService.transformPointToVoxels(MOCK_POINTS, 30, GEODETIC.EPSG4326);
      expect(result).toEqual(expectedValue);
    });

    it("POINTが『空配列』の場合に空配列が返却されること", () => {
      // 実行して結果を比較
      const result = coordinateService.transformPointToVoxels([], 30, GEODETIC.EPSG6668);
      // 期待値 → 空配列
      expect(result).toEqual([]);
    });

    it("POINTが『1つ』の場合に『EPSG6668』に変換された座標に対する『zoomlevel: 25(undefined入力)』の空間IDが返却されること", () => {
      // 期待値(zoomlevel → デフォルト値)
      const expectedValue = [{ f: 0, x: 29797454, y: 13212106, z: ZFXY_1M_ZOOM_BASE }];

      // 実行して結果を比較
      const result = coordinateService.transformPointToVoxels(MOCK_POINT, undefined, GEODETIC.EPSG6668);
      expect(result).toEqual(expectedValue);
    });

    it("POINTが『1つ』の場合に『EPSG6668(undefined入力)』に変換された座標に対する『zoomlevel: 30』の空間IDが返却されること", () => {
      // 期待値
      const expectedValue = [{ f: 0, x: 953518531, y: 422787405, z: 30 }];

      // 実行して結果を比較
      const result = coordinateService.transformPointToVoxels(MOCK_POINT, 30, undefined);
      expect(result).toEqual(expectedValue);
    });
  });

  describe("transformPolygonToVoxels", () => {
    it("POLYGONが『1つ』の場合に『EPSG6668』に変換された座標に対する『zoomlevel: 25』の空間IDが返却されること", () => {
      // 期待値
      const expectedValue = [
        [
          { f: 0, x: 29409102, y: 13325874, z: 25 },
          { f: 0, x: 29409934, y: 13326093, z: 25 },
          { f: 0, x: 29409856, y: 13326998, z: 25 },
          { f: 0, x: 29409509, y: 13326995, z: 25 },
          { f: 0, x: 29408908, y: 13326909, z: 25 },
          { f: 0, x: 29408756, y: 13326810, z: 25 },
          { f: 0, x: 29408610, y: 13326271, z: 25 },
          { f: 0, x: 29408835, y: 13326119, z: 25 },
          { f: 0, x: 29408834, y: 13326035, z: 25 },
          { f: 0, x: 29408998, y: 13325909, z: 25 },
        ],
      ];

      // 実行して結果を比較
      const result = coordinateService.transformPolygonToVoxels(MOCK_POLYGON, 25, GEODETIC.EPSG6668);
      expect(result).toEqual(expectedValue);
    });

    it("POLYGONが『複数』の場合に『EPSG4326』に変換された座標に対する『zoomlevel: 30』の空間IDが返却されること", () => {
      // 期待値
      const expectedValue = [
        [
          { f: 0, x: 941091293, y: 426427981, z: 30 },
          { f: 0, x: 941117892, y: 426434978, z: 30 },
          { f: 0, x: 941115396, y: 426463949, z: 30 },
          { f: 0, x: 941104300, y: 426463869, z: 30 },
          { f: 0, x: 941085072, y: 426461090, z: 30 },
          { f: 0, x: 941080201, y: 426457949, z: 30 },
          { f: 0, x: 941075539, y: 426440673, z: 30 },
          { f: 0, x: 941082730, y: 426435823, z: 30 },
          { f: 0, x: 941082694, y: 426433121, z: 30 },
          { f: 0, x: 941087965, y: 426429105, z: 30 },
        ],
        [
          { f: 0, x: 941063594, y: 426700480, z: 30 },
          { f: 0, x: 941070961, y: 426701412, z: 30 },
          { f: 0, x: 941074952, y: 426705525, z: 30 },
          { f: 0, x: 941095051, y: 426703564, z: 30 },
          { f: 0, x: 941095218, y: 426725475, z: 30 },
          { f: 0, x: 941056704, y: 426725490, z: 30 },
          { f: 0, x: 941058055, y: 426710291, z: 30 },
        ],
      ];

      // 実行して結果を比較
      const result = coordinateService.transformPolygonToVoxels(MOCK_POLYGONS, 30, GEODETIC.EPSG4326);
      expect(result).toEqual(expectedValue);
    });

    it("POLYGONが『空配列』の場合に空配列が返却されること", () => {
      // 実行して結果を比較
      const result = coordinateService.transformPolygonToVoxels([], 30, GEODETIC.EPSG6668);
      // 期待値 → 空配列
      expect(result).toEqual([]);
    });

    it("POLYGONが『1つ』の場合に『EPSG6668』に変換された座標に対する『zoomlevel: 25(undefined入力)』の空間IDが返却されること", () => {
      // 期待値(zoomlevel → デフォルト値)
      const expectedValue = [
        [
          { f: 0, x: 29409102, y: 13325874, z: ZFXY_1M_ZOOM_BASE },
          { f: 0, x: 29409934, y: 13326093, z: ZFXY_1M_ZOOM_BASE },
          { f: 0, x: 29409856, y: 13326998, z: ZFXY_1M_ZOOM_BASE },
          { f: 0, x: 29409509, y: 13326995, z: ZFXY_1M_ZOOM_BASE },
          { f: 0, x: 29408908, y: 13326909, z: ZFXY_1M_ZOOM_BASE },
          { f: 0, x: 29408756, y: 13326810, z: ZFXY_1M_ZOOM_BASE },
          { f: 0, x: 29408610, y: 13326271, z: ZFXY_1M_ZOOM_BASE },
          { f: 0, x: 29408835, y: 13326119, z: ZFXY_1M_ZOOM_BASE },
          { f: 0, x: 29408834, y: 13326035, z: ZFXY_1M_ZOOM_BASE },
          { f: 0, x: 29408998, y: 13325909, z: ZFXY_1M_ZOOM_BASE },
        ],
      ];

      // 実行して結果を比較
      const result = coordinateService.transformPolygonToVoxels(MOCK_POLYGON, undefined, GEODETIC.EPSG6668);
      expect(result).toEqual(expectedValue);
    });

    it("POLYGONが『1つ』の場合に『EPSG6668(undefined入力)』に変換された座標に対する『zoomlevel: 30』の空間IDが返却されること", () => {
      // 期待値
      const expectedValue = [
        [
          { f: 0, x: 941091293, y: 426427981, z: 30 },
          { f: 0, x: 941117892, y: 426434978, z: 30 },
          { f: 0, x: 941115396, y: 426463949, z: 30 },
          { f: 0, x: 941104300, y: 426463869, z: 30 },
          { f: 0, x: 941085072, y: 426461090, z: 30 },
          { f: 0, x: 941080201, y: 426457949, z: 30 },
          { f: 0, x: 941075539, y: 426440673, z: 30 },
          { f: 0, x: 941082730, y: 426435823, z: 30 },
          { f: 0, x: 941082694, y: 426433121, z: 30 },
          { f: 0, x: 941087965, y: 426429105, z: 30 },
        ],
      ];

      // 実行して結果を比較
      const result = coordinateService.transformPolygonToVoxels(MOCK_POLYGON, 30, undefined);
      expect(result).toEqual(expectedValue);
    });
  });

  describe("transformVoxelToTopPoints", () => {
    it("空間IDが『複数』の場合に各空間IDに対する頂点座標(8点)が返却されること", () => {
      // 期待値
      const expectedValue = [
        [
          { lon: 139.69199996441603, lat: 35.68900022002069 },
          { lon: 139.69199996441603, lat: 35.68899994771092 },
          { lon: 139.69200029969215, lat: 35.68899994771092 },
          { lon: 139.69200029969215, lat: 35.68900022002069 },
          { lon: 139.69199996441603, lat: 35.68900022002069 },
          { lon: 139.69199996441603, lat: 35.68899994771092 },
          { lon: 139.69200029969215, lat: 35.68899994771092 },
          { lon: 139.69200029969215, lat: 35.68900022002069 },
        ],
        [
          { lon: 135.51999986171722, lat: 34.686000153285455 },
          { lon: 135.51999986171722, lat: 34.68599987759357 },
          { lon: 135.52000019699335, lat: 34.68599987759357 },
          { lon: 135.52000019699335, lat: 34.686000153285455 },
          { lon: 135.51999986171722, lat: 34.686000153285455 },
          { lon: 135.51999986171722, lat: 34.68599987759357 },
          { lon: 135.52000019699335, lat: 34.68599987759357 },
          { lon: 135.52000019699335, lat: 34.686000153285455 },
        ],
        [
          { lon: 139.69199895858765, lat: 35.68900376004768 },
          { lon: 139.69199895858765, lat: 35.68899504613478 },
          { lon: 139.6920096874237, lat: 35.68899504613478 },
          { lon: 139.6920096874237, lat: 35.68900376004768 },
          { lon: 139.69199895858765, lat: 35.68900376004768 },
          { lon: 139.69199895858765, lat: 35.68899504613478 },
          { lon: 139.6920096874237, lat: 35.68899504613478 },
          { lon: 139.6920096874237, lat: 35.68900376004768 },
        ],
      ];

      // 実行して結果を比較
      const result = coordinateService.transformVoxelToTopPoints(MOCK_POINT_SPACE_IDS);
      expect(result).toEqual(expectedValue);
    });
  });

  describe("transformPointToSurroundingVoxels", () => {
    it("POINTが『1つ』の場合に『EPSG6668』に変換された座標に対する『zoomlevel: 25』の周辺空間ID(上下・東西南北)が返却されること", () => {
      // 期待値
      const expectedValue = [
        [
          { z: 25, f: 1, x: 29797454, y: 13212106 },
          { z: 25, f: -1, x: 29797454, y: 13212106 },
          { z: 25, f: 0, x: 29797455, y: 13212106 },
          { z: 25, f: 0, x: 29797453, y: 13212106 },
          { z: 25, f: 0, x: 29797454, y: 13212105 },
          { z: 25, f: 0, x: 29797454, y: 13212107 },
        ],
      ];

      // 実行して結果を比較
      const result = coordinateService.transformPointToSurroundingVoxels(MOCK_POINT, 25, GEODETIC.EPSG6668);
      expect(result).toEqual(expectedValue);
    });

    it("POINTが『複数』の場合に『EPSG4326』に変換された座標に対する『zoomlevel: 30』の周辺空間ID(上下・東西南北)が返却されること", () => {
      // 期待値
      const expectedValue = [
        [
          { z: 30, f: 1, x: 953518531, y: 422787405 },
          { z: 30, f: -1, x: 953518531, y: 422787405 },
          { z: 30, f: 0, x: 953518532, y: 422787405 },
          { z: 30, f: 0, x: 953518530, y: 422787405 },
          { z: 30, f: 0, x: 953518531, y: 422787404 },
          { z: 30, f: 0, x: 953518531, y: 422787406 },
        ],
        [
          { z: 30, f: 1, x: 941075056, y: 426447931 },
          { z: 30, f: -1, x: 941075056, y: 426447931 },
          { z: 30, f: 0, x: 941075057, y: 426447931 },
          { z: 30, f: 0, x: 941075055, y: 426447931 },
          { z: 30, f: 0, x: 941075056, y: 426447930 },
          { z: 30, f: 0, x: 941075056, y: 426447932 },
        ],
      ];

      // 実行して結果を比較
      const result = coordinateService.transformPointToSurroundingVoxels(MOCK_POINTS, 30, GEODETIC.EPSG4326);
      expect(result).toEqual(expectedValue);
    });

    it("POINTが『空配列』の場合に空配列が返却されること", () => {
      // 実行して結果を比較
      const result = coordinateService.transformPointToSurroundingVoxels([], 30, GEODETIC.EPSG6668);
      // 期待値 → 空配列
      expect(result).toEqual([]);
    });

    it("POINTが『1つ』の場合に『EPSG6668』に変換された座標に対する『zoomlevel: 25(undefined入力)』の周辺空間ID(上下・東西南北)が返却されること", () => {
      // 期待値(zoomlevel → デフォルト値)
      const expectedValue = [
        [
          { z: ZFXY_1M_ZOOM_BASE, f: 1, x: 29797454, y: 13212106 },
          { z: ZFXY_1M_ZOOM_BASE, f: -1, x: 29797454, y: 13212106 },
          { z: ZFXY_1M_ZOOM_BASE, f: 0, x: 29797455, y: 13212106 },
          { z: ZFXY_1M_ZOOM_BASE, f: 0, x: 29797453, y: 13212106 },
          { z: ZFXY_1M_ZOOM_BASE, f: 0, x: 29797454, y: 13212105 },
          { z: ZFXY_1M_ZOOM_BASE, f: 0, x: 29797454, y: 13212107 },
        ],
      ];

      // 実行して結果を比較
      const result = coordinateService.transformPointToSurroundingVoxels(MOCK_POINT, undefined, GEODETIC.EPSG6668);
      expect(result).toEqual(expectedValue);
    });

    it("POINTが『1つ』の場合に『EPSG6668(undefined入力)』に変換された座標に対する『zoomlevel: 30』の周辺空間ID(上下・東西南北)が返却されること", () => {
      // 期待値
      const expectedValue = [
        [
          { z: 30, f: 1, x: 953518531, y: 422787405 },
          { z: 30, f: -1, x: 953518531, y: 422787405 },
          { z: 30, f: 0, x: 953518532, y: 422787405 },
          { z: 30, f: 0, x: 953518530, y: 422787405 },
          { z: 30, f: 0, x: 953518531, y: 422787404 },
          { z: 30, f: 0, x: 953518531, y: 422787406 },
        ],
      ];

      // 実行して結果を比較
      const result = coordinateService.transformPointToSurroundingVoxels(MOCK_POINT, 30, undefined);
      expect(result).toEqual(expectedValue);
    });
  });

  describe("transformVoxelToSurroundingVoxels", () => {
    it("空間IDが『複数』の場合に周辺空間ID(上下・東西南北)が返却されること", () => {
      // 期待値
      const expectedValue = [
        [
          { z: 30, f: 1, x: 953518531, y: 422787405 },
          { z: 30, f: -1, x: 953518531, y: 422787405 },
          { z: 30, f: 0, x: 953518532, y: 422787405 },
          { z: 30, f: 0, x: 953518530, y: 422787405 },
          { z: 30, f: 0, x: 953518531, y: 422787404 },
          { z: 30, f: 0, x: 953518531, y: 422787406 },
        ],
        [
          { z: 30, f: 1, x: 941075056, y: 426447931 },
          { z: 30, f: -1, x: 941075056, y: 426447931 },
          { z: 30, f: 0, x: 941075057, y: 426447931 },
          { z: 30, f: 0, x: 941075055, y: 426447931 },
          { z: 30, f: 0, x: 941075056, y: 426447930 },
          { z: 30, f: 0, x: 941075056, y: 426447932 },
        ],
        [
          { z: 25, f: 1, x: 29797454, y: 13212106 },
          { z: 25, f: -1, x: 29797454, y: 13212106 },
          { z: 25, f: 0, x: 29797455, y: 13212106 },
          { z: 25, f: 0, x: 29797453, y: 13212106 },
          { z: 25, f: 0, x: 29797454, y: 13212105 },
          { z: 25, f: 0, x: 29797454, y: 13212107 },
        ],
      ];

      // 実行して結果を比較
      const result = coordinateService.transformVoxelToSurroundingVoxels(MOCK_POINT_SPACE_IDS);
      expect(result).toEqual(expectedValue);
    });
  });

  describe("transformMeshToLatAndLon", () => {
    it("1次メッシュコードが『5339』の場合に緯度経度『{ lon: 139, lat: 35.333333333333336 }』が返却されること", () => {
      // 期待値
      const expectedValue = { lon: 139, lat: 35.333333333333336 };

      // 実行して結果を比較
      const result = coordinateService.transformMeshToLatAndLon(MOCK_MESHCODE.code1);
      expect(result).toEqual(expectedValue);
    });

    it("2次メッシュコードが『533946』の場合に緯度経度『{ lon: 139.75, lat: 35.66666666666667 }』が返却されること", () => {
      // 期待値
      const expectedValue = { lon: 139.75, lat: 35.66666666666667 };

      // 実行して結果を比較
      const result = coordinateService.transformMeshToLatAndLon(MOCK_MESHCODE.code2);
      expect(result).toEqual(expectedValue);
    });

    it("3次メッシュコードが『53394611』の場合に緯度経度『{ lon: 139.7625, lat: 35.675000000000004 }』が返却されること", () => {
      // 期待値
      const expectedValue = { lon: 139.7625, lat: 35.675000000000004 };

      // 実行して結果を比較
      const result = coordinateService.transformMeshToLatAndLon(MOCK_MESHCODE.code3);
      expect(result).toEqual(expectedValue);
    });
  });

  describe("transformMeshToBBox", () => {
    it("1次メッシュコードが『5339』の場合に『EPSG6668』へ変換された座標に対するBBOX『[139, 35.333333333333336, 140, 36]』が返却されること", () => {
      // 期待値
      const expectedValue = [139, 35.333333333333336, 140, 36];

      // 実行して結果を比較
      const result = coordinateService.transformMeshToBBox(MOCK_MESHCODE.code1, GEODETIC.EPSG6668);
      expect(result).toEqual(expectedValue);
    });

    it("2次メッシュコードが『533946』の場合に『EPSG4326』へ変換された座標に対するBBOX『[139.75, 35.66666666666667, 139.875, 35.75]』が返却されること", () => {
      // 期待値
      const expectedValue = [139.75, 35.66666666666667, 139.875, 35.75];

      // 実行して結果を比較
      const result = coordinateService.transformMeshToBBox(MOCK_MESHCODE.code2, GEODETIC.EPSG4326);
      expect(result).toEqual(expectedValue);
    });

    it("3次メッシュコードが『53394611』の場合に『EPSG6668(undefined入力)』へ変換された座標に対するBBOX『[139.7625, 35.675000000000004, 139.775, 35.68333333333334]』が返却されること", () => {
      // 期待値
      const expectedValue = [139.7625, 35.675000000000004, 139.775, 35.68333333333334];

      // 実行して結果を比較
      const result = coordinateService.transformMeshToBBox(MOCK_MESHCODE.code3, undefined);
      expect(result).toEqual(expectedValue);
    });
  });

  describe("transformLinkIdToVoxels", () => {
    it("リンクIDが『1』の場合に『zoomlevel: 15』の空間IDが返却されること", async () => {
      // モックデータの設定
      const linkId = 1;
      const zoomLevel = 15;
      enumSetRepository.findBy = jest.fn().mockResolvedValue([
        {
          id: 4,
          trafficLinkId: linkId,
          seq: 1,
          linkId: 1,
          totalStartDistance: 1,
          totalEndDistance: 1,
        },
      ]);
      schemaRelationRepository.createQueryBuilder = jest.fn().mockReturnValue({
        orderBy: jest.fn().mockReturnThis(),
        setParameter: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({
          recordId: 1,
          viewerVersion: 20241010,
          hdmapVersion: 20241010,
          sdmapVersion: 20241010,
          himozukeVersion: 20241010,
          createdAt: dayjs().toDate(),
          updatedAt: dayjs().toDate(),
        }),
      });

      mergedLinkRepository.query = jest.fn().mockResolvedValue([
        {
          geom: '{"type":"MultiLineString","coordinates":[[[137.824060,34.833219],[137.829775,34.832558]],[[137.921950,34.822655],[137.928458,34.822735]]]}',
        },
      ]);

      // 期待値
      const expectedValue = [
        { x: 28929, y: 12997, z: 15, f: 0 },
        { x: 28937, y: 12999, z: 15, f: 0 },
        { x: 28938, y: 12999, z: 15, f: 0 },
      ];

      // アサーションの呼び出し確認
      expect.assertions(1);
      // 実行して結果を比較
      await expect(coordinateService.transformLinkIdToVoxels(linkId, zoomLevel)).resolves.toEqual(expectedValue);
    });

    it("リンクIDが『1』の場合に『zoomlevel: 20(undefined入力)』の空間IDが返却されること", async () => {
      // モックデータの設定
      const linkId = 1;
      enumSetRepository.findBy = jest.fn().mockResolvedValue([
        {
          id: 4,
          trafficLinkId: linkId,
          seq: 1,
          linkId: 1,
          totalStartDistance: 1,
          totalEndDistance: 1,
        },
      ]);
      schemaRelationRepository.createQueryBuilder = jest.fn().mockReturnValue({
        orderBy: jest.fn().mockReturnThis(),
        setParameter: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({
          recordId: 1,
          viewerVersion: 20241010,
          hdmapVersion: 20241010,
          sdmapVersion: 20241010,
          himozukeVersion: 20241010,
          createdAt: dayjs().toDate(),
          updatedAt: dayjs().toDate(),
        }),
      });

      mergedLinkRepository.query = jest.fn().mockResolvedValue([
        {
          geom: '{"type":"MultiLineString","coordinates":[[[137.824060,34.833219],[137.829775,34.832558]],[[137.921950,34.822655],[137.928458,34.822735]]]}',
        },
      ]);

      // 期待値
      const expectedValue = [
        { x: 925729, y: 415931, z: MAX_ZOOM_LEVEL, f: 0 },
        { x: 925730, y: 415931, z: MAX_ZOOM_LEVEL, f: 0 },
        { x: 925731, y: 415931, z: MAX_ZOOM_LEVEL, f: 0 },
        { x: 925732, y: 415931, z: MAX_ZOOM_LEVEL, f: 0 },
        { x: 925733, y: 415931, z: MAX_ZOOM_LEVEL, f: 0 },
        { x: 925734, y: 415931, z: MAX_ZOOM_LEVEL, f: 0 },
        { x: 925735, y: 415931, z: MAX_ZOOM_LEVEL, f: 0 },
        { x: 925735, y: 415932, z: MAX_ZOOM_LEVEL, f: 0 },
        { x: 925736, y: 415932, z: MAX_ZOOM_LEVEL, f: 0 },
        { x: 925737, y: 415932, z: MAX_ZOOM_LEVEL, f: 0 },
        { x: 925738, y: 415932, z: MAX_ZOOM_LEVEL, f: 0 },
        { x: 925739, y: 415932, z: MAX_ZOOM_LEVEL, f: 0 },
        { x: 925740, y: 415932, z: MAX_ZOOM_LEVEL, f: 0 },
        { x: 925741, y: 415932, z: MAX_ZOOM_LEVEL, f: 0 },
        { x: 925742, y: 415932, z: MAX_ZOOM_LEVEL, f: 0 },
        { x: 925743, y: 415932, z: MAX_ZOOM_LEVEL, f: 0 },
        { x: 925743, y: 415933, z: MAX_ZOOM_LEVEL, f: 0 },
        { x: 925744, y: 415933, z: MAX_ZOOM_LEVEL, f: 0 },
        { x: 925745, y: 415933, z: MAX_ZOOM_LEVEL, f: 0 },
        { x: 925746, y: 415933, z: MAX_ZOOM_LEVEL, f: 0 },
        { x: 926014, y: 415968, z: MAX_ZOOM_LEVEL, f: 0 },
        { x: 926015, y: 415968, z: MAX_ZOOM_LEVEL, f: 0 },
        { x: 926016, y: 415968, z: MAX_ZOOM_LEVEL, f: 0 },
        { x: 926017, y: 415968, z: MAX_ZOOM_LEVEL, f: 0 },
        { x: 926018, y: 415968, z: MAX_ZOOM_LEVEL, f: 0 },
        { x: 926019, y: 415968, z: MAX_ZOOM_LEVEL, f: 0 },
        { x: 926020, y: 415968, z: MAX_ZOOM_LEVEL, f: 0 },
        { x: 926021, y: 415968, z: MAX_ZOOM_LEVEL, f: 0 },
        { x: 926022, y: 415968, z: MAX_ZOOM_LEVEL, f: 0 },
        { x: 926023, y: 415968, z: MAX_ZOOM_LEVEL, f: 0 },
        { x: 926024, y: 415968, z: MAX_ZOOM_LEVEL, f: 0 },
        { x: 926025, y: 415968, z: MAX_ZOOM_LEVEL, f: 0 },
        { x: 926026, y: 415968, z: MAX_ZOOM_LEVEL, f: 0 },
        { x: 926027, y: 415968, z: MAX_ZOOM_LEVEL, f: 0 },
        { x: 926028, y: 415968, z: MAX_ZOOM_LEVEL, f: 0 },
        { x: 926029, y: 415968, z: MAX_ZOOM_LEVEL, f: 0 },
        { x: 926030, y: 415968, z: MAX_ZOOM_LEVEL, f: 0 },
        { x: 926031, y: 415968, z: MAX_ZOOM_LEVEL, f: 0 },
        { x: 926032, y: 415968, z: MAX_ZOOM_LEVEL, f: 0 },
        { x: 926033, y: 415968, z: MAX_ZOOM_LEVEL, f: 0 },
      ];

      // アサーションの呼び出し確認
      expect.assertions(1);
      // 実行して結果を比較
      await expect(coordinateService.transformLinkIdToVoxels(linkId, undefined)).resolves.toEqual(expectedValue);
    });

    it("『zoomlevelが21以上』の場合はLoggerService.errorが呼び出されBadRequestExceptionがスローされること", async () => {
      // モックデータの設定
      const linkId = 1;

      const spyLoggerService = jest.spyOn(loggerService, "error");

      // アサーションの呼び出し確認
      expect.assertions(2);
      // 実行して結果を比較
      await expect(coordinateService.transformLinkIdToVoxels(linkId, 21)).rejects.toThrow(BadRequestException);
      // LoggerService.errorが呼び出されたか確認
      expect(spyLoggerService).toHaveBeenCalledWith(new BadRequestException());
    });

    it("DB接続が失敗した場合はLoggerService.errorが呼び出されCannotExecuteNotConnectedErrorがスローされること", async () => {
      // モックデータの設定
      const linkId = 2;
      enumSetRepository.findBy = jest.fn().mockImplementation(() => {
        throw new CannotExecuteNotConnectedError("DB接続エラー");
      });

      const spyLoggerService = jest.spyOn(loggerService, "error");

      // アサーションの呼び出し確認
      expect.assertions(2);
      // 実行して結果を比較
      await expect(coordinateService.transformLinkIdToVoxels(linkId)).rejects.toThrow(CannotExecuteNotConnectedError);
      // LoggerService.errorが呼び出されたか確認
      expect(spyLoggerService).toHaveBeenCalledWith(new CannotExecuteNotConnectedError("DB接続エラー"));
    });
  });
});
