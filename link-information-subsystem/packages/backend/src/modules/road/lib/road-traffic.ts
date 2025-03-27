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

export class RoadTraffic implements PBFLib, GeoJsonLib {
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
      .from(FinalHimozukeSet, "fh")

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

    query.leftJoin(HdSdRoadLink, "sd", "sd.linkId = fh.linkId");

    query.leftJoin(HdLaneCenterLine, "tg", "sd.linkId = tg.linkId AND sd.linkDirection = tg.linkDirection");

    if (condition.roadSegmentId) {
      query
        .addSelect("ST_AsGeoJSON(ST_Transform(fh.geom, 4326))", "geometry")
        .andWhere("tg.roadSegmentId = :roadSegmentId")
        .setParameter("roadSegmentId", condition.roadSegmentId);
    }

    // 道路名絞込
    RoadName.addFilterRoadNameQuery(query, condition.roadName);

    // 交通規制・渋滞情報なので区分は0
    query.andWhere("fh.trafficType = :trafficType").setParameter("trafficType", 0);

    query
      .addGroupBy("tl.provideDatetime")
      .addGroupBy("tl.routeName")
      .addGroupBy("tl.directionName")
      .addGroupBy("tl.cause")
      .addGroupBy("tl.regulation")
      .addGroupBy("tl.severity")
      .addGroupBy("tl.length")
      .addGroupBy("tl.downstreamKp")
      .addGroupBy("tl.downstreamLatitude")
      .addGroupBy("tl.downstreamLongitude")
      .addGroupBy("tl.downstreamHeight")
      .addGroupBy("tl.downstreamDistance")
      .addGroupBy("tl.upstreamKp")
      .addGroupBy("tl.upstreamLatitude")
      .addGroupBy("tl.upstreamLongitude")
      .addGroupBy("tl.upstreamHeight")
      .addGroupBy("tl.upstreamDistance")
      .addGroupBy("tl.laneCategory")
      .addGroupBy("tl.plannedEndTimestamp")
      .addGroupBy("tl.causeVehicleName1")
      .addGroupBy("tl.causeVehicleNumber1")
      .addGroupBy("tl.causeVehicleName2")
      .addGroupBy("tl.causeVehicleNumber2")
      .addGroupBy("tl.causeVehicleName3")
      .addGroupBy("tl.causeVehicleNumber3")
      .addGroupBy("tl.handlingStatus")
      .addGroupBy("tl.prediction")
      .addGroupBy("tl.plannedResumeTimestamp");

    return query;
  }
}
