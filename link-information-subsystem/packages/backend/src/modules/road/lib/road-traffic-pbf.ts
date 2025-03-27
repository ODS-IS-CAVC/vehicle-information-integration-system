import { SelectQueryBuilder } from "typeorm";
import { GeoJsonLib } from "../../shares/geojson.lib.interface";
import { MAP_SOURCE } from "src/consts/map.const";
import { PBFLib } from "../../shares/pbf/pbf.interface";
import { HdSdRoadLink } from "src/entities/viewer/hd-sd-road-link.entity";
import { RoadName } from "./common/road-name";
import { SdRoadName } from "src/entities/sdmap/road-name.entity";
import { SchemaRelation } from "src/entities/version/schema-relation.entity";
import { updateSchemaForEntities } from "./common/entity-utils";
import { HdLaneCenterLine } from "src/entities/viewer/hd-lane-center-line.entity";
import { FinalHimozukeSet } from "src/entities/traffic/final_himozuke_set.entity";
import { TrafficLink } from "src/entities/traffic/traffic-link.entity";

export class RoadTrafficPBF implements PBFLib, GeoJsonLib {
  readonly sourceId = MAP_SOURCE.TRAFFIC;

  createPropertiesQuery(
    query: SelectQueryBuilder<any>,
    condition: { roadName?: string; roadSegmentId?: string },
    schemaRelation: SchemaRelation,
  ) {
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
      .addSelect("COALESCE(tg.linkDirection, -1)", "direction");

    if (condition.roadSegmentId) {
      query
        .addSelect("ST_AsGeoJSON(ST_Transform(tg.geom, 4326))", "geometry")
        .andWhere("tg.roadSegmentId = :roadSegmentId")
        .setParameter("roadSegmentId", condition.roadSegmentId);
    }

    query
      .leftJoin(HdSdRoadLink, "sd", "sd.linkId = tg.linkId AND sd.linkDirection = tg.linkDirection")
      .addSelect("COALESCE(sd.roadClassCode, -1)", "classCode")
      .addSelect("COALESCE(sd.roadNameCode, -1)", "nameCode")

      .leftJoin(FinalHimozukeSet, "fh", "tg.linkId = fh.linkId")

      .innerJoin(TrafficLink, "tl", "fh.trafficLinkId = tl.trafficLinkId AND fh.trafficSeq = tl.trafficSeq")
      .addSelect("tl.provideDatetime", "timestamp")
      .addSelect("tl.routeName", "routeName")
      .addSelect("tl.directionName", "directionName")
      .addSelect("tl.cause", "cause")
      .addSelect("tl.regulation", "regulation")
      .addSelect("tl.severity", "severity")
      .addSelect("tl.length", "length")
      .addSelect("tl.downstreamKp", "downstreamKp")
      .addSelect("tl.downstreamLatitude", "downstreamLat")
      .addSelect("tl.downstreamLongitude", "downstreamLon")
      .addSelect("tl.downstreamHeight", "downstreamHi")
      .addSelect("tl.downstreamDistance", "downstreamDistance")
      .addSelect("tl.upstreamKp", "upstreamKP")
      .addSelect("tl.upstreamLatitude", "upstreamLat")
      .addSelect("tl.upstreamLongitude", "upstreamLon")
      .addSelect("tl.upstreamHeight", "upstreamHi")
      .addSelect("tl.upstreamDistance", "upstreamDistance")
      .addSelect("tl.laneCategory", "laneCategory")
      .addSelect("tl.plannedEndTimestamp", "plannedEndTimestamp")
      .addSelect("tl.causeVehicleName1", "causeVehicleName1")
      .addSelect("tl.causeVehicleNumber1", "causeVehicleNumber1")
      .addSelect("tl.causeVehicleName2", "causeVehicleName2")
      .addSelect("tl.causeVehicleNumber2", "causeVehicleNumber2")
      .addSelect("tl.causeVehicleName3", "causeVehicleName3")
      .addSelect("tl.causeVehicleNumber3", "causeVehicleNumber3")
      .addSelect("tl.handlingStatus", "handlingStatus")
      .addSelect("tl.prediction", "prediction")
      .addSelect("tl.plannedResumeTimestamp", "plannedResumeTimestamp");

    // 交通規制・渋滞情報なので区分は0
    query.andWhere("fh.column03 = :column03").setParameter("column03", 0);

    // 道路名絞込
    RoadName.addFilterRoadNameQuery(query, condition.roadName);

    return query;
  }
}
