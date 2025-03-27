import { SelectQueryBuilder } from "typeorm";
import { GeoJsonLib } from "src/modules/shares/geojson.lib.interface";
import { MAP_SOURCE } from "src/consts/map.const";
import { PBFLib } from "../../shares/pbf/pbf.interface";
import { RoadName } from "./common/road-name";
import { updateSchemaForEntities } from "./common/entity-utils";
import { FinalHimozukeSet } from "src/entities/traffic/final_himozuke_set.entity";
import { HdLaneCenterLine } from "src/entities/viewer/hd-lane-center-line.entity";
import { HdSdRoadLink } from "src/entities/viewer/hd-sd-road-link.entity";
import { SdRoadName } from "src/entities/sdmap/road-name.entity";
import { SchemaRelation } from "src/entities/version/schema-relation.entity";
import { TripTime } from "src/entities/traffic/trip-time.entity";

export class RoadTripTime implements PBFLib, GeoJsonLib {
  readonly sourceId = MAP_SOURCE.TRIP_TIME;

  createPropertiesQuery(query: SelectQueryBuilder<any>, condition: { roadName?: string }, schemaRelation: SchemaRelation) {
    // 指定したエンティティのスキーマ名に対してバージョン情報を付与
    const entityNames = [HdLaneCenterLine.name, HdSdRoadLink.name, SdRoadName.name];
    updateSchemaForEntities(query, entityNames, schemaRelation);

    query
      .from(HdLaneCenterLine, "tg")
      .select("tg.roadSegmentId", "roadSegmentId")
      .addSelect("tg.laneNumber", "laneNumber")
      .addSelect("tg.minSequence", "minSeq")
      .addSelect("tg.maxSequence", "maxSeq")
      .addSelect("COALESCE(tg.linkId, -1)", "linkId")
      .addSelect("COALESCE(tg.linkDirection, -1)", "direction")

      .leftJoin(HdSdRoadLink, "sd", "sd.linkId = tg.linkId AND sd.linkDirection = tg.linkDirection")
      .addSelect("COALESCE(sd.roadClassCode, -1)", "classCode")
      .addSelect("COALESCE(sd.roadNameCode, -1)", "nameCode")

      .leftJoin(FinalHimozukeSet, "fh", "tg.linkId = fh.linkId")

      .innerJoin(TripTime, "tt", "fh.trafficLinkId = tt.trafficLinkId AND fh.trafficSeq = tt.trafficSeq")
      .addSelect("tt.travelTime", "travelTime");

    // 道路名絞込
    RoadName.addFilterRoadNameQuery(query, condition.roadName);

    // NOTE: type = 1は電文の種類「旅行時間情報」を表す
    query.andWhere("fh.column03 = :column03").setParameter("column03", 1);

    return query;
  }
}
