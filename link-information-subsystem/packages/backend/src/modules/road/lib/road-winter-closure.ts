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
import { WinterClosure } from "src/entities/traffic/winter-closure.entity";

export class RoadWinterClosure implements PBFLib, GeoJsonLib {
  readonly sourceId = MAP_SOURCE.WINTER_CLOSURE;

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
      .innerJoin(WinterClosure, "wc", "fh.trafficLinkId = wc.trafficLinkId AND fh.trafficSeq = wc.trafficSeq")
      .addSelect("wc.provideDatetime", "timestamp")
      .addSelect("wc.routeName", "routeName")
      .addSelect("wc.directionName", "directionName")
      .addSelect("wc.cause", "cause")
      .addSelect("wc.regulation", "regulation")
      .addSelect("wc.downstreamLatitude", "downstreamLat")
      .addSelect("wc.downstreamLongitude", "downstreamLon")
      .addSelect("wc.downstreamHeight", "downstreamHi")
      .addSelect("wc.downstreamDistance", "downstreamDistance")
      .addSelect("wc.upstreamLatitude", "upstreamLat")
      .addSelect("wc.upstreamLongitude", "upstreamLon")
      .addSelect("wc.upstreamHeight", "upstreamHi")
      .addSelect("wc.upstreamDistance", "upstreamDistance")
      .addSelect("wc.laneCategory", "laneCategory")
      .addSelect("wc.plannedStartTimestamp", "plannedStartTimestamp")
      .addSelect("wc.plannedEndTimestamp", "plannedEndTimestamp")
      .addSelect("wc.endTimestamp", "endTimestamp")
      .addSelect("wc.detour1", "detour1")
      .addSelect("wc.detour2", "detour2")
      .addSelect(`CASE WHEN wc.isCurrentStatus = true THEN 1 ELSE 0 END`, "isCurrentStatus");

    query.leftJoin(HdSdRoadLink, "sd", "sd.linkId = fh.linkId");

    query.leftJoin(HdLaneCenterLine, "tg", "sd.linkId = tg.linkId AND sd.linkDirection = tg.linkDirection");

    if (condition.timestamp) {
      query
        .andWhere("wc.plannedStartTimestamp <= :timeStamp")
        .andWhere("wc.plannedEndTimestamp >= :timeStamp")
        .setParameter("timeStamp", condition.timestamp);
    }

    if (condition.startTimestamp && condition.endTimestamp) {
      query
        .andWhere("wc.plannedEndTimestamp > :startTimeStamp")
        .andWhere("wc.plannedStartTimestamp < :endTimestamp")
        .setParameter("startTimeStamp", condition.startTimestamp)
        .setParameter("endTimestamp", condition.endTimestamp);
    }

    // 道路名絞込
    RoadName.addFilterRoadNameQuery(query, condition.roadName);

    // 冬季閉鎖情報なので区分は3
    query.andWhere("fh.trafficType = :trafficType").setParameter("trafficType", 3);

    query
      .addGroupBy("wc.provideDatetime")
      .addGroupBy("wc.routeName")
      .addGroupBy("wc.directionName")
      .addGroupBy("wc.cause")
      .addGroupBy("wc.regulation")
      .addGroupBy("wc.downstreamLatitude")
      .addGroupBy("wc.downstreamLongitude")
      .addGroupBy("wc.downstreamHeight")
      .addGroupBy("wc.downstreamDistance")
      .addGroupBy("wc.upstreamLatitude")
      .addGroupBy("wc.upstreamLongitude")
      .addGroupBy("wc.upstreamHeight")
      .addGroupBy("wc.upstreamDistance")
      .addGroupBy("wc.laneCategory")
      .addGroupBy("wc.plannedStartTimestamp")
      .addGroupBy("wc.plannedEndTimestamp")
      .addGroupBy("wc.endTimestamp")
      .addGroupBy("wc.detour1")
      .addGroupBy("wc.detour2")
      .addGroupBy("wc.isCurrentStatus");

    return query;
  }
}
