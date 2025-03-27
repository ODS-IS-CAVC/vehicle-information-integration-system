import { Test, TestingModule } from "@nestjs/testing";
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
import { SchemaRelationService } from "src/modules/util/schema-relation.service";
import { LoggerService } from "src/modules/util/logger/logger.service";
import { RoadService } from "../../road.service";

describe("hasTimestamp", () => {
  let roadService: RoadService;
  let module: TestingModule;

  beforeAll(async () => {
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
  });

  afterAll(async () => {
    await module.close();
  });

  it("timestamp プロパティがあるオブジェクトの場合に true を返すべき", () => {
    const condition = { timestamp: "2023-10-12T08:00:00Z" };
    expect(roadService.hasTimestamp(condition)).toBe(true);
  });

  it("timestamp プロパティがないオブジェクトの場合に false を返すべき", () => {
    const condition = { time: "2023-10-12T08:00:00Z" };
    expect(roadService.hasTimestamp(condition)).toBe(false);
  });
});
