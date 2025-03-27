import { RoadService } from "../../road.service";
import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HdLaneCenterLine } from "src/entities/viewer/hd-lane-center-line.entity";
import { SchemaRelationService } from "src/modules/util/schema-relation.service";
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

const schemaRelation: SchemaRelation = {
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

jest.mock("typeorm", () => {
  const originalModule = jest.requireActual("typeorm");
  return {
    ...originalModule,
    SelectQueryBuilder: jest.fn().mockImplementation((queryRunner) => {
      const mockQueryBuilder = {
        queryRunner,
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawMany: jest.fn(),
        connection: {
          entityMetadatas: [
            {
              name: "HdLaneCenterLine",
              tableMetadataArgs: { schema: "viewer" },
              schema: "viewer",
              tableName: "hd_lane_center_lines",
              tablePath: "viewer.hd_lane_center_lines",
            },
            {
              name: "HdSdRoadLink",
              tableMetadataArgs: { schema: "viewer" },
              schema: "viewer",
              tableName: "hd_sd_road_links",
              tablePath: "viewer.hd_sd_road_links",
            },
            {
              name: "SdRoadName",
              tableMetadataArgs: { schema: "sdmap" },
              schema: "sdmap",
              tableName: "road_code_list",
              tablePath: "sdmap.road_code_list",
            },
          ],
        },
      };
      return mockQueryBuilder;
    }),
    createQueryBuilder: jest.fn().mockImplementation((entity, queryRunner) => {
      const connection = { type: "mocked-connection" };
      return new originalModule.SelectQueryBuilder(connection, queryRunner);
    }),
  };
});

describe("getExtraTrafficGeoJSON", () => {
  let service: RoadService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: "postgres",
          host: "database",
          port: 5432,
          username: "postgres",
          password: "postgres",
          database: "DMDB",
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
    service = module.get<RoadService>(RoadService);
    const schemaRelationService = module.get<SchemaRelationService>(SchemaRelationService);
    jest.spyOn(schemaRelationService, "getSchemaRelation").mockResolvedValue(schemaRelation);
  });

  afterAll(async () => {
    await module.close();
  });

  it("SourceIDがGeoJSON出力対象外の場合、Nullが返却されること。", async () => {
    const result = await service.getExtraTrafficGeoJSON(MAP_SOURCE.SD_ROAD_LINK, { roadSegmentId: 23366 });
    expect(result).toBeNull();
  });

  it("データが存在しない場合、空配列（features）が返されること。", async () => {
    const result = await service.getExtraTrafficGeoJSON(MAP_SOURCE.TRAFFIC, { roadSegmentId: 23367 });
    expect(result).toEqual({
      type: "FeatureCollection",
      features: [],
    });
  });

  it("データが見つかった場合はGeoJSONデータが返却されること。", async () => {
    const result = await service.getExtraTrafficGeoJSON(MAP_SOURCE.TRAFFIC, { roadSegmentId: 23366 });
    expect(result).toHaveProperty("type", "FeatureCollection");
    expect(result.features).toBeInstanceOf(Array);

    if (result.features.length > 0) {
      expect(result.features[0]).toHaveProperty("type", "Feature");
      expect(result.features[0].geometry).toHaveProperty("type", "LineString");
      expect(result.features[0].geometry).toHaveProperty("coordinates");
    }
  });
});
