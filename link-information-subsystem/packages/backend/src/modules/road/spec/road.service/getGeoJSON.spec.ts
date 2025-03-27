import { Test, TestingModule } from "@nestjs/testing";
import { RoadService } from "../../road.service";
import { DataSource } from "typeorm";
import { SchemaRelationService } from "src/modules/util/schema-relation.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HdLaneCenterLine } from "src/entities/viewer/hd-lane-center-line.entity";
import { HdSdRoadLink } from "src/entities/viewer/hd-sd-road-link.entity";
import { SdRoadName } from "src/entities/sdmap/road-name.entity";
import { SchemaRelation } from "src/entities/version/schema-relation.entity";
import { HdLaneLine } from "src/entities/viewer/hd-lane-line.entity";
import { HdLane } from "src/entities/ushr-format/hd-lane.entity";
import { HdRoadEdgeLine } from "src/entities/viewer/hd-road-edge-line.entity";
import { HdSdRelation } from "src/entities/himozuke/hd-sd-relation.entity";
import { HdIntersection } from "src/entities/ushr-format/hd-intersection.entity";
import { HdIntersectionMapping } from "src/entities/ushr-format/hd-intersection-mapping.entity";
import { HdPavementMarking } from "src/entities/ushr-format/hd-pavement-marking.entity";
import { HdPavementMarkingMapping } from "src/entities/ushr-format/hd-pavement-marking-mapping.entity";
import { HdSignMapping } from "src/entities/ushr-format/hd-sign-mapping.entity";
import { HdSign } from "src/entities/ushr-format/hd-sign.entity";
import { MergedLink } from "src/entities/sdmap/merged-link.entity";
import { SdRoadNode } from "src/entities/sdmap/road-node.entity";
import { FinalHimozukeSet } from "src/entities/traffic/final_himozuke_set.entity";
import { TrafficLink } from "src/entities/traffic/traffic-link.entity";
import { TripTime } from "src/entities/traffic/trip-time.entity";
import { ConstructionEvent } from "src/entities/traffic/construction-event.entity";
import { WinterClosure } from "src/entities/traffic/winter-closure.entity";
import { EntryExit } from "src/entities/traffic/entry-exit.entity";
import { EnumSet } from "src/entities/traffic/enum-set.entity";
import { PrefCity } from "src/entities/share/pref-cities.entity";
import { CoordinateService } from "src/modules/util/coordinate.service";
import { MAP_SOURCE } from "src/consts/map.const";
import { CommonRoadGeoJSONGetWithoutTimestampQueryDTO, HdLaneCenterGeoJSONGetQueryDTO } from "../../dto/road.dto";
import { LoggerService } from "src/modules/util/logger/logger.service";
import { CropMap } from "src/modules/shares/crop/crop";
import { BadRequestException, UnprocessableEntityException } from "@nestjs/common";
import { RoadHdLaneLineProperties } from "../../dto/road-hd-lane-line-properties";
import { plainToInstance } from "class-transformer";
import { RoadTrafficProperties } from "../../dto/road-traffic-properties";
import { RoadEntryExitProperties } from "../../dto/road-entry-exit-properties";
import { RoadHdLaneCenterProperties } from "../../dto/road-hd-lane-center-properties";

const mockSchemaRelation: SchemaRelation = {
  recordId: 3,
  viewerVersion: 20241031,
  hdmapVersion: 20240919,
  sdmapVersion: 20240823,
  himozukeVersion: 20241007,
  createdAt: new Date("2024-10-31T00:26:27.655Z"),
  updatedAt: new Date("2024-10-31T00:26:27.655Z"),
  hasId: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  softRemove: jest.fn(),
  recover: jest.fn(),
  reload: jest.fn(),
};

const crop: any = {
  type: "MultiPolygon",
  coordinates: [
    [
      [
        [139.662591974, 35.510053294],
        [139.662591974, 35.506635841],
        [139.660402379, 35.506635841],
        [139.660402379, 35.510053294],
        [139.662591974, 35.510053294],
      ],
    ],
  ],
};

jest.mock("typeorm", () => {
  const originalModule = jest.requireActual("typeorm");
  return {
    ...originalModule,
    SelectQueryBuilder: jest.fn().mockImplementation((queryRunner) => {
      const mockQueryBuilder = {
        queryRunner,
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        setParameter: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn(),
        connection: {
          entityMetadatas: [],
        },
      };
      return mockQueryBuilder;
    }),
  };
});

describe("RoadService.getGeoJSON", () => {
  let roadService: RoadService;
  let dataSource: DataSource;
  let schemaRelationService: SchemaRelationService;
  let module: TestingModule;
  let spyCreateCropMultiPolygon: jest.SpyInstance;
  let mockQueryBuilder;
  let loggerService: LoggerService;
  let spyLoggerService: jest.SpyInstance;

  beforeAll(async () => {
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
          logging: true,
        }),
        TypeOrmModule.forFeature([
          HdLaneCenterLine,
          HdSdRoadLink,
          SdRoadName,
          SchemaRelation,
          HdLaneLine,
          HdLane,
          HdRoadEdgeLine,
          HdSdRelation,
          HdIntersection,
          HdIntersectionMapping,
          HdPavementMarking,
          HdPavementMarkingMapping,
          HdSignMapping,
          HdSign,
          MergedLink,
          SdRoadNode,
          FinalHimozukeSet,
          TrafficLink,
          TripTime,
          ConstructionEvent,
          WinterClosure,
          EntryExit,
          EnumSet,
          PrefCity,
        ]),
      ],
      providers: [RoadService, CoordinateService, SchemaRelationService, LoggerService],
    }).compile();

    await module.init();
    roadService = module.get<RoadService>(RoadService);
    dataSource = module.get<DataSource>(DataSource);
    schemaRelationService = module.get<SchemaRelationService>(SchemaRelationService);
    loggerService = module.get<LoggerService>(LoggerService);
    mockQueryBuilder = new (jest.requireMock("typeorm").SelectQueryBuilder)();
    jest.spyOn(dataSource, "createQueryBuilder").mockReturnValue(mockQueryBuilder);
    jest.spyOn(schemaRelationService, "getSchemaRelation").mockReturnValue(Promise.resolve(mockSchemaRelation));
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    spyCreateCropMultiPolygon = jest.spyOn(CropMap, "createCropMultiPolygon").mockResolvedValue(crop);
    spyLoggerService = jest.spyOn(loggerService, "error");
    mockQueryBuilder.getRawMany.mockReset();
    mockQueryBuilder.getRawMany.mockReturnValue(
      Promise.resolve([
        {
          id: 1,
          geometry: {
            type: "MultiPolygon",
            coordinates: [
              [
                [139.662591974, 35.510053294],
                [139.662591974, 35.506635841],
                [139.660402379, 35.506635841],
                [139.660402379, 35.510053294],
                [139.662591974, 35.510053294],
              ],
            ],
          },
          roadInfo: [
            "11666:1:0:1:23604204:1:101:201130",
            "11666:1:100:101:23604204:1:101:201130",
            "11666:1:101:102:23604204:1:101:201130",
            "11666:1:102:103:23604204:1:101:201130",
            "11666:1:103:104:23604204:1:101:201130",
            "11666:1:104:105:23604204:1:101:201130",
            "11666:1:105:106:23604204:1:101:201130",
            "11666:1:106:107:23604204:1:101:201130",
            "11666:1:107:108:23604204:1:101:201130",
            "11666:1:108:109:23604204:1:101:201130",
          ],
        },
      ]),
    );
  });

  afterEach(async () => {
    spyCreateCropMultiPolygon.mockClear();
    mockQueryBuilder.getRawMany.mockReset();
    spyLoggerService.mockRestore();
  });

  it("リクエスト指定がない場合、400: BadRequestが返却されること", async () => {
    await expect(() => roadService.getGeoJSON(undefined, undefined)).rejects.toThrow(BadRequestException);
    expect(spyLoggerService).toHaveBeenCalledWith(new BadRequestException());
  });

  it("リクエスト内容がbbox指定の場合で、正常に値が取得されること。", async () => {
    const query = plainToInstance(RoadHdLaneLineProperties, {
      bbox: "130,30,140,40",
      timestamp: "2024-11-21T00:00:00.000Z",
    }) as unknown as HdLaneCenterGeoJSONGetQueryDTO;
    const result = await roadService.getGeoJSON<RoadHdLaneLineProperties>(MAP_SOURCE.HD_LANE_CENTER, query);
    expect(result).not.toBe("");
  });

  it("リクエスト内容がmesh指定の場合で、正常に値が取得されること。", async () => {
    const query = plainToInstance(RoadTrafficProperties, {
      mesh: "5339",
    }) as unknown as CommonRoadGeoJSONGetWithoutTimestampQueryDTO;
    const result = await roadService.getGeoJSON<RoadTrafficProperties>(MAP_SOURCE.TRAFFIC, query);
    expect(result).not.toBe("");
  });

  it("リクエスト内容がcity指定の場合で、正常に値が取得されること。", async () => {
    const query = plainToInstance(RoadEntryExitProperties, {
      city: "14101",
    }) as unknown as CommonRoadGeoJSONGetWithoutTimestampQueryDTO;
    const result = await roadService.getGeoJSON<RoadEntryExitProperties>(MAP_SOURCE.ENTRY_EXIT, query);
    expect(result).not.toBe("");
  });

  it("リクエスト内容がvoxel指定の場合で、正常に値が取得されること。", async () => {
    const query = plainToInstance(RoadHdLaneLineProperties, {
      f: 0,
      x: 931113,
      y: 413561,
      z: 20,
    }) as unknown as HdLaneCenterGeoJSONGetQueryDTO;
    const result = await roadService.getGeoJSON<RoadHdLaneLineProperties>(MAP_SOURCE.HD_LANE_LINE, query);
    expect(result).not.toBe("");
  });

  it("範囲指定取得が実行されること。", async () => {
    const query: HdLaneCenterGeoJSONGetQueryDTO = {
      x: 953518531,
      y: 422787405,
      z: 30,
      f: 0,
    } as HdLaneCenterGeoJSONGetQueryDTO;
    await roadService.getGeoJSON<RoadHdLaneCenterProperties>(MAP_SOURCE.HD_LANE_CENTER, query);
    expect(spyCreateCropMultiPolygon).toHaveBeenCalledTimes(1);
  });

  it("範囲指定取得で422エラーが返却された場合、そのまま同じ内容がThrowされること。", async () => {
    spyCreateCropMultiPolygon.mockRejectedValue(new UnprocessableEntityException());
    const query: HdLaneCenterGeoJSONGetQueryDTO = {
      mesh: 52385599,
    } as HdLaneCenterGeoJSONGetQueryDTO;
    await expect(() => roadService.getGeoJSON<RoadHdLaneCenterProperties>(MAP_SOURCE.HD_LANE_CENTER, query)).rejects.toThrow(
      UnprocessableEntityException,
    );
  });

  it("SourceIDがGeoJSON出力対象外の場合、Nullが返却されること。", async () => {
    const query: HdLaneCenterGeoJSONGetQueryDTO = {
      mesh: 52385599,
    } as HdLaneCenterGeoJSONGetQueryDTO;
    const result = await roadService.getGeoJSON<RoadHdLaneCenterProperties>(MAP_SOURCE.SD_ROAD_LINK, query);
    expect(result).toBeNull();
  });

  it("検索結果が0件の場合、空データが返却されること。", async () => {
    const query = plainToInstance(HdLaneCenterGeoJSONGetQueryDTO, {
      bbox: "130,30,140,40",
    }) as HdLaneCenterGeoJSONGetQueryDTO;

    mockQueryBuilder.getRawMany.mockReturnValue(Promise.resolve([]));
    const result = await roadService.getGeoJSON<RoadHdLaneCenterProperties>(MAP_SOURCE.HD_LANE_CENTER, query);
    expect(result).toEqual({
      type: "FeatureCollection",
      features: [],
    });
  });
});
