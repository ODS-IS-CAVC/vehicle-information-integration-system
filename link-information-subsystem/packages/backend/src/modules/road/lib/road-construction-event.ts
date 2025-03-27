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
import { ConstructionEvent } from "src/entities/traffic/construction-event.entity";

export class RoadConstructionEvent implements PBFLib, GeoJsonLib {
  readonly sourceId = MAP_SOURCE.CONSTRUCTION_EVENT;

  createPropertiesQuery(
    query: SelectQueryBuilder<any>,
    condition: { roadName?: string; timestamp?: string; startTimestamp?: string; endTimestamp?: string },
    schemaRelation: SchemaRelation,
  ) {
    // 指定したエンティティのスキーマ名に対してバージョン情報を付与
    const entityNames = [HdLaneCenterLine.name, HdSdRoadLink.name, SdRoadName.name];
    updateSchemaForEntities(query, entityNames, schemaRelation);

    query
      .from(FinalHimozukeSet, "fh")
      .innerJoin(ConstructionEvent, "ce", "fh.trafficLinkId = ce.trafficLinkId AND fh.trafficSeq = ce.trafficSeq")
      .addSelect("ce.provideDatetime", "timestamp")
      .addSelect("ce.routeName", "routeName")
      .addSelect("ce.directionName", "directionName")
      .addSelect("ce.cause", "cause")
      .addSelect("ce.regulation", "regulation")
      .addSelect("ce.downstreamKp", "downstreamKP")
      .addSelect("ce.downstreamLatitude", "downstreamLat")
      .addSelect("ce.downstreamLongitude", "downstreamLon")
      .addSelect("ce.downstreamHeight", "downstreamHi")
      .addSelect("ce.downstreamDistance", "downstreamDistance")
      .addSelect("ce.upstreamKp", "upstreamKP")
      .addSelect("ce.upstreamLatitude", "upstreamLat")
      .addSelect("ce.upstreamLongitude", "upstreamLon")
      .addSelect("ce.upstreamHeight", "upstreamHi")
      .addSelect("ce.upstreamDistance", "upstreamDistance")
      .addSelect("ce.laneCategory", "laneCategory")
      .addSelect("ce.plannedStartTimestamp", "plannedStartTimestamp")
      .addSelect("ce.plannedEndTimestamp", "plannedEndTimestamp")
      .addSelect("ce.endTimestamp", "endTimestamp")
      .addSelect("ce.detour1", "detour1")
      .addSelect("ce.detour2", "detour2")
      .addSelect(`CASE WHEN ce.isCurrentStatus = true THEN 1 ELSE 0 END`, "isCurrentStatus");

    query.leftJoin(HdSdRoadLink, "sd", "sd.linkId = fh.linkId");

    query.leftJoin(HdLaneCenterLine, "tg", "sd.linkId = tg.linkId AND sd.linkDirection = tg.linkDirection");

    if (condition.timestamp) {
      query
        .andWhere("ce.plannedStartTimestamp <= :timeStamp")
        .andWhere("ce.plannedEndTimestamp >= :timeStamp")
        .setParameter("timeStamp", condition.timestamp);
    }

    if (condition.startTimestamp && condition.endTimestamp) {
      query
        .andWhere("ce.plannedEndTimestamp > :startTimeStamp")
        .andWhere("ce.plannedStartTimestamp < :endTimestamp")
        .setParameter("startTimeStamp", condition.startTimestamp)
        .setParameter("endTimestamp", condition.endTimestamp);
    }

    // 道路名絞込
    RoadName.addFilterRoadNameQuery(query, condition.roadName);

    // 工事行事予定情報なので区分は2
    query.andWhere("fh.column03 = :column03").setParameter("column03", 2);

    query
      .addGroupBy("ce.provideDatetime")
      .addGroupBy("ce.routeName")
      .addGroupBy("ce.directionName")
      .addGroupBy("ce.cause")
      .addGroupBy("ce.regulation")
      .addGroupBy("ce.downstreamKp")
      .addGroupBy("ce.downstreamLatitude")
      .addGroupBy("ce.downstreamLongitude")
      .addGroupBy("ce.downstreamHeight")
      .addGroupBy("ce.downstreamDistance")
      .addGroupBy("ce.upstreamKp")
      .addGroupBy("ce.upstreamLatitude")
      .addGroupBy("ce.upstreamLongitude")
      .addGroupBy("ce.upstreamHeight")
      .addGroupBy("ce.upstreamDistance")
      .addGroupBy("ce.laneCategory")
      .addGroupBy("ce.plannedStartTimestamp")
      .addGroupBy("ce.plannedEndTimestamp")
      .addGroupBy("ce.endTimestamp")
      .addGroupBy("ce.detour1")
      .addGroupBy("ce.detour2")
      .addGroupBy("ce.isCurrentStatus");
    return query;
  }
}
