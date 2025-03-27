import { Test, TestingModule } from "@nestjs/testing";
import { DataSource, QueryFailedError, SelectQueryBuilder } from "typeorm";
import { RoadService } from "../../road.service";
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
import { LoggerService } from "src/modules/util/logger/logger.service";
import { MAP_SOURCE } from "src/consts/map.const";
import { BadRequestException } from "@nestjs/common";
import { PBF } from "src/modules/shares/pbf/pbf";

describe("RoadService.createPBFBuffer", () => {
  let service: RoadService;
  let dataSource: DataSource;
  let schemaRelation: SchemaRelationService;
  const x = 116386;
  const y = 51694;
  const z = 17;

  let spyAddPBFGeometryQuery: jest.SpyInstance;
  let createPropertiesQuery: { [sourceId: string]: jest.SpyInstance } = {};
  let module: TestingModule;
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
    service = module.get<RoadService>(RoadService);
    dataSource = module.get<DataSource>(DataSource);
    schemaRelation = module.get<SchemaRelationService>(SchemaRelationService);
    loggerService = module.get<LoggerService>(LoggerService);
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(() => {
    spyLoggerService = jest.spyOn(loggerService, "error");
  });

  afterEach(() => {
    spyLoggerService.mockRestore();
  });

  describe("SourceIDが道路PBF出力対象", () => {
    let subQuery: SelectQueryBuilder<any>;

    beforeEach(() => {
      const qb = dataSource.createQueryBuilder();
      subQuery = qb.subQuery().clone().from(HdLaneCenterLine, "tg");

      jest.spyOn(qb, "subQuery").mockReturnValue(subQuery);
      jest.spyOn(qb, "getRawOne").mockResolvedValue({ data: Buffer.from("abc") });
      jest.spyOn(dataSource, "createQueryBuilder").mockReturnValue(qb);
      jest.spyOn(schemaRelation, "getSchemaRelation").mockReturnValue(
        Promise.resolve({
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
        }),
      );

      spyAddPBFGeometryQuery = jest.spyOn(PBF, "addPBFGeometryQuery");

      createPropertiesQuery = {};
      for (const lib of (service as any).pbfLibs) {
        createPropertiesQuery[lib.sourceId] = jest.spyOn(lib, "createPropertiesQuery").mockReturnValue(subQuery);
      }
    });

    it.each`
      sourceId                          | sourceName
      ${MAP_SOURCE.HD_LANE_CENTER}      | ${"HD車線中心線"}
      ${MAP_SOURCE.HD_LANE_LINE}        | ${"区画線"}
      ${MAP_SOURCE.HD_ROAD_EDGE}        | ${"HD道路縁"}
      ${MAP_SOURCE.HD_INTERSECTION}     | ${"HD交差点"}
      ${MAP_SOURCE.HD_PAVEMENT_MARKING} | ${"HD路面標識"}
      ${MAP_SOURCE.HD_SIGN}             | ${"HD道路標識"}
      ${MAP_SOURCE.SD_ROAD_LINK}        | ${"SDリンク"}
      ${MAP_SOURCE.SD_ROAD_NODE}        | ${"SDノード"}
      ${MAP_SOURCE.TRAFFIC}             | ${"交通渋滞・規制情報"}
      ${MAP_SOURCE.CONSTRUCTION_EVENT}  | ${"工事行事予定情報"}
      ${MAP_SOURCE.ENTRY_EXIT}          | ${"入口出口閉鎖情報"}
      ${MAP_SOURCE.TRIP_TIME}           | ${"旅行時間情報"}
      ${MAP_SOURCE.WINTER_CLOSURE}      | ${"冬季閉鎖情報"}
    `("$sourceName", async ({ sourceId }) => {
      await service.createPBFBuffer(sourceId, x, y, z);
      expect(createPropertiesQuery[sourceId]).toHaveBeenCalled();

      expect(spyAddPBFGeometryQuery).toHaveBeenCalledWith(subQuery, {
        x,
        y,
        z,
      });

      const result = await service.createPBFBuffer(sourceId, x, y, z);
      expect(result).toEqual(Buffer.from("abc"));
    });
  });

  describe("SourceIDが道路PBF出力対象外", () => {
    it.each`
      sourceId          | sourceName
      ${"weather-risk"} | ${"気象リスク"}
    `("$sourceName", async ({ sourceId }) => {
      const result = await service.createPBFBuffer(sourceId, x, y, z);
      expect(result).toBeNull();
    });
  });

  describe("xyz整合性不備", () => {
    beforeEach(() => {
      // クエリビルダーのモック設定
      jest.spyOn(dataSource, "createQueryBuilder").mockReturnValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            setParameters: jest.fn().mockReturnValue({
              getRawOne: jest.fn().mockImplementation(() => {
                throw new QueryFailedError("SELECT * FROM table", [], new Error("ST_TileEnvelope: Invalid tile"));
              }),
            }),
          }),
        }),
      } as any);
    });

    it("z(zoom) に対して x が不正の場合、BadRequestExceptionがThrowされること", async () => {
      await expect(service.createPBFBuffer(MAP_SOURCE.HD_LANE_CENTER, 3, 0, 1)).rejects.toThrow(BadRequestException);
      expect(spyLoggerService).toHaveBeenCalledWith(expect.any(QueryFailedError));
    });

    it("z(zoom) に対して y が不正の場合、BadRequestExceptionがThrowされること", async () => {
      await expect(service.createPBFBuffer(MAP_SOURCE.HD_LANE_CENTER, 0, 3, 1)).rejects.toThrow(BadRequestException);
      expect(spyLoggerService).toHaveBeenCalledWith(expect.any(QueryFailedError));
    });
  });

  describe("データベースに対するデータ取得時の例外処理", () => {
    it("予期しないエラーが発生したい際に同じエラーが再スローされること", async () => {
      jest.spyOn(dataSource, "createQueryBuilder").mockReturnValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            setParameters: jest.fn().mockReturnValue({
              getRawOne: jest.fn().mockImplementation(() => {
                throw new Error("Unexpected Error");
              }),
            }),
          }),
        }),
      } as any);

      await expect(service.createPBFBuffer(MAP_SOURCE.HD_LANE_CENTER, 1, 1, 1)).rejects.toThrow("Unexpected Error");
      expect(spyLoggerService).toHaveBeenCalledWith(new Error("Unexpected Error"));
    });

    it("クエリ結果をfalsyな値の場合、nullが返却されること", async () => {
      jest.spyOn(dataSource, "createQueryBuilder").mockReturnValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            setParameters: jest.fn().mockReturnValue({
              getRawOne: jest.fn().mockReturnValue(null),
            }),
          }),
        }),
      } as any);

      const result = await service.createPBFBuffer(MAP_SOURCE.HD_LANE_CENTER, 1, 1, 1);
      expect(result).toBeNull();
    });
  });
});
