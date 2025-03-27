import { Test, TestingModule } from "@nestjs/testing";
import { TransformCoordinatesService } from "../transform-coordinates.service";
import { GEODETIC } from "../../../shares/lib/proj4";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LoggerService } from "../../util/logger/logger.service";

import { CoordinateService } from "src/modules/util/coordinate.service";
import { MergedLink } from "src/entities/sdmap/merged-link.entity";
import { EnumSet } from "src/entities/traffic/enum-set.entity";
import { PrefCity } from "src/entities/share/pref-cities.entity";
import { SchemaRelationService } from "src/modules/util/schema-relation.service";
import { SchemaRelation } from "src/entities/version/schema-relation.entity";
import { BadRequestException } from "@nestjs/common";
import { ZFXY_1M_ZOOM_BASE } from "src/ouranos-gex-lib/src/zfxy";
import { LineStringsQueryDTO } from "../dto/line-string-query.dto";
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
    loggerService = module.get(LoggerService);
  });

  let errorLog: jest.SpyInstance;
  beforeEach(async () => {
    errorLog = jest.spyOn(loggerService, "error");
  });

  afterEach(async () => {
    await module.close();
  });

  it("should be defined", () => {
    expect(transformCoordinatesService).toBeDefined();
  });

  const MOCK_ZOOM_LEVEL = 20;

  describe("getLineString", () => {
    const MOCK_VOXEL_REQUEST: LineStringsQueryDTO = {
      startX: 931283,
      startY: 412959,
      startZ: MOCK_ZOOM_LEVEL,
      startF: 0,
      endX: 931285,
      endY: 412958,
      endZ: MOCK_ZOOM_LEVEL,
      endF: 0,
      roadName: "",
      geodetic: GEODETIC.EPSG4326,
    };

    it("空間IDの指定がない場合、400エラーが返却され、エラーログが出力されること。", async () => {
      await expect(() => transformCoordinatesService.getLineString(undefined)).rejects.toThrow(BadRequestException);
      expect(errorLog).toHaveBeenCalledWith(new BadRequestException());
    });

    it("座標系[EPSG4326]を指定して、空間IDの中心点2点をLineStringへ変換", async () => {
      const result = await transformCoordinatesService.getLineString(MOCK_VOXEL_REQUEST);
      expect(result).toEqual([
        [{ lon: 139.73081588745117, lat: 35.66636180331941 }],
        [{ lon: 139.73150253295898, lat: 35.66664072715776 }],
      ]);
    });

    it("座標系を指定せず、空間IDの中心点2点をLineStringへ変換", async () => {
      const result = await transformCoordinatesService.getLineString({ ...MOCK_VOXEL_REQUEST, geodetic: GEODETIC.EPSG6668 });
      expect(result).toEqual([
        [{ lon: 139.73081588745117, lat: 35.66636180331941 }],
        [{ lon: 139.73150253295898, lat: 35.66664072715776 }],
      ]);
    });

    it("座標系を指定せず、空間IDの中心点2点、道路名称[石垣]で指定しLineStringへ変換", async () => {
      const voxelQuery: LineStringsQueryDTO = {
        startX: 28236112,
        startY: 14425766,
        startZ: ZFXY_1M_ZOOM_BASE,
        startF: 0,
        endX: 28235779,
        endY: 14425631,
        endZ: ZFXY_1M_ZOOM_BASE,
        endF: 0,
        roadName: "石垣",
        geodetic: undefined,
      };
      const result = await transformCoordinatesService.getLineString(voxelQuery);
      expect(result).toEqual([
        {
          lon: 122.940612163,
          lat: 24.450527637,
        },
      ]);
    });

    it("座標系[EPSG4326]指定し、空間IDの中心点2点、道路名称[石垣]で指定しLineStringへ変換", async () => {
      const voxelQuery: LineStringsQueryDTO = {
        startX: 28236112,
        startY: 14425766,
        startZ: ZFXY_1M_ZOOM_BASE,
        startF: 0,
        endX: 28235779,
        endY: 14425631,
        endZ: ZFXY_1M_ZOOM_BASE,
        endF: 0,
        roadName: "石垣",
        geodetic: GEODETIC.EPSG4326,
      };
      const result = await transformCoordinatesService.getLineString(voxelQuery);
      expect(result).toEqual([
        {
          lon: 122.94061216300001,
          lat: 24.450527637,
        },
      ]);
    });

    it("空間IDの中心点2点を指定し、指定した道路名称が存在しない場合空配列が返却されること", async () => {
      const result = await transformCoordinatesService.getLineString({ ...MOCK_VOXEL_REQUEST, roadName: "テスト" });
      expect(result).toStrictEqual([]);
    });
  });
});
