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
import { EntryExit } from "src/entities/traffic/entry-exit.entity";

export class RoadEntryExit implements PBFLib, GeoJsonLib {
  readonly sourceId = MAP_SOURCE.ENTRY_EXIT;

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

      .innerJoin(EntryExit, "ee", "fh.trafficLinkId = ee.trafficLinkId AND fh.trafficSeq = ee.trafficSeq")
      .addSelect("ee.provideDatetime", "timestamp")
      .addSelect("ee.routeName", "routeName")
      .addSelect("ee.directionName", "directionName")
      .addSelect("ee.name", "name")
      .addSelect("ee.latitude", "latitude")
      .addSelect("ee.longitude", "longitude")
      .addSelect("ee.height", "height")
      .addSelect("ee.isEntrance", "isEntrance");

    // 道路名絞込
    RoadName.addFilterRoadNameQuery(query, condition.roadName);

    // NOTE: type = 4は電文の種類「入口出口閉鎖情報」を表す
    query.andWhere("fh.column03 = :column03").setParameter("column03", 4);

    return query;
  }
}
