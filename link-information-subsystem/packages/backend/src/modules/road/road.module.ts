import { Module } from "@nestjs/common";
import { RoadController } from "./road.controller";
import { RoadService } from "./road.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HdLaneCenterLine } from "src/entities/viewer/hd-lane-center-line.entity";
import { HdSdRoadLink } from "src/entities/viewer/hd-sd-road-link.entity";
import { SdRoadName } from "src/entities/sdmap/road-name.entity";
import { UtilModule } from "../util/util.module";
import { SchemaRelation } from "src/entities/version/schema-relation.entity";
import { HdLaneLine } from "src/entities/viewer/hd-lane-line.entity";
import { HdLane } from "src/entities/ushr-format/hd-lane.entity";
import { HdIntersection } from "src/entities/ushr-format/hd-intersection.entity";
import { HdIntersectionMapping } from "src/entities/ushr-format/hd-intersection-mapping.entity";
import { HdRoadEdgeLine } from "src/entities/viewer/hd-road-edge-line.entity";
import { HdPavementMarking } from "src/entities/ushr-format/hd-pavement-marking.entity";
import { HdPavementMarkingMapping } from "src/entities/ushr-format/hd-pavement-marking-mapping.entity";
import { HdSignMapping } from "src/entities/ushr-format/hd-sign-mapping.entity";
import { HdSign } from "src/entities/ushr-format/hd-sign.entity";
import { HdSdRelation } from "src/entities/himozuke/hd-sd-relation.entity";
import { MergedLink } from "src/entities/sdmap/merged-link.entity";
import { SdRoadNode } from "src/entities/sdmap/road-node.entity";
import { TrafficLink } from "src/entities/traffic/traffic-link.entity";
import { FinalHimozukeSet } from "src/entities/traffic/final_himozuke_set.entity";
import { TripTime } from "src/entities/traffic/trip-time.entity";
import { WinterClosure } from "src/entities/traffic/winter-closure.entity";
import { ConstructionEvent } from "src/entities/traffic/construction-event.entity";
import { EntryExit } from "src/entities/traffic/entry-exit.entity";

@Module({
  imports: [
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
    ]),
    UtilModule,
  ],
  controllers: [RoadController],
  providers: [RoadService],
  exports: [RoadService],
})
export class RoadModule {}
