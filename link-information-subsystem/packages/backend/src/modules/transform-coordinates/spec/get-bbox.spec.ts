import { Test, TestingModule } from "@nestjs/testing";
import { TransformCoordinatesService } from "../transform-coordinates.service";
import { BadRequestException, UnprocessableEntityException } from "@nestjs/common";
import { GEODETIC } from "../../../shares/lib/proj4";
import { TypeOrmModule } from "@nestjs/typeorm";

import { CoordinateService } from "src/modules/util/coordinate.service";
import { MergedLink } from "src/entities/sdmap/merged-link.entity";
import { EnumSet } from "src/entities/traffic/enum-set.entity";
import { PrefCity } from "src/entities/share/pref-cities.entity";
import { SchemaRelationService } from "src/modules/util/schema-relation.service";
import { SchemaRelation } from "src/entities/version/schema-relation.entity";
import { BBoxQueryDTO } from "../dto/bbox-query.dto";
import { LoggerService } from "src/modules/util/logger/logger.service";

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
        TypeOrmModule.forFeature([EnumSet, PrefCity, SchemaRelation, MergedLink]),
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

  let errorLog: jest.SpyInstance;
  beforeEach(async () => {
    errorLog = jest.spyOn(loggerService, "error");
  });

  describe("getBBox", () => {
    const MOCK_VOXELS_REQUEST: BBoxQueryDTO = {
      x: 29094,
      y: 12930,
      z: 15,
      f: undefined,
      mesh: undefined,
      city: undefined,
      geodetic: GEODETIC.EPSG4326,
    };

    const MOCK_MESH_REQUEST: BBoxQueryDTO = {
      x: undefined,
      y: undefined,
      z: undefined,
      f: undefined,
      mesh: 53391531,
      city: undefined,
      geodetic: GEODETIC.EPSG4326,
    };

    const MOCK_CITY_REQUEST: BBoxQueryDTO = {
      x: undefined,
      y: undefined,
      z: undefined,
      f: undefined,
      mesh: undefined,
      city: "14104",
      geodetic: GEODETIC.EPSG4326,
    };

    it("リクエスト指定がない場合、400エラーが返却され、エラーログが出力されること。", async () => {
      await expect(() => transformCoordinatesService.getBBox(undefined)).rejects.toThrow(BadRequestException);
      expect(errorLog).toHaveBeenCalledWith(new BadRequestException());
    });

    it("測地系EPSG4326を指定し、空間IDをBBOXへ変換", async () => {
      const result = await transformCoordinatesService.getBBox(MOCK_VOXELS_REQUEST);
      expect(result).toEqual([139.63623046875, 35.43381992014202, 139.647216796875, 35.44277092585767]);
    });

    it("測地系指定がない場合、空間IDをBBOXへ変換", async () => {
      const result = await transformCoordinatesService.getBBox({ ...MOCK_VOXELS_REQUEST, geodetic: GEODETIC.EPSG6668 });
      expect(result).toEqual([139.63623046875, 35.43381992014202, 139.647216796875, 35.442770925857666]);
    });

    it("測地系EPSG4326を指定し、メッシュコードをBBOXへ変換", async () => {
      const result = await transformCoordinatesService.getBBox(MOCK_MESH_REQUEST);
      expect(result).toEqual([139.63750000000002, 35.44166666666667, 139.65000000000003, 35.45]);
    });

    it("測地系指定がない場合、メッシュコードをBBOXへ変換", async () => {
      const result = await transformCoordinatesService.getBBox({ ...MOCK_MESH_REQUEST, geodetic: GEODETIC.EPSG6668 });
      expect(result).toEqual([139.6375, 35.44166666666667, 139.65, 35.45]);
    });

    it("測地系EPSG4326を指定し、行政区画コードをBBOXへ変換", async () => {
      const result = await transformCoordinatesService.getBBox(MOCK_CITY_REQUEST);
      expect(result).toEqual([139.621666446, 35.393159055, 139.695190998, 35.45862364]);
    });

    it("測地系指定がない場合、行政区画コードをBBOXへ変換", async () => {
      const result = await transformCoordinatesService.getBBox({ ...MOCK_CITY_REQUEST, geodetic: GEODETIC.EPSG6668 });
      expect(result).toEqual([139.621666446, 35.393159055, 139.695190998, 35.45862364]);
    });

    it("指定した行政区画コードが存在しない場合、422エラーとエラーログが出力されること", async () => {
      await expect(() => transformCoordinatesService.getBBox({ ...MOCK_CITY_REQUEST, city: "12000" })).rejects.toThrow(
        UnprocessableEntityException,
      );
      expect(errorLog).toHaveBeenCalledWith(new UnprocessableEntityException());
    });
  });
});
