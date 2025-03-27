import { SelectQueryBuilder } from "typeorm";
import { GeoJsonLib } from "../../shares/geojson.lib.interface";
import { PBFLib } from "../../shares/pbf/pbf.interface";
import { RoadName } from "./common/road-name";
import { MAP_SOURCE } from "src/consts/map.const";
import { HdLaneLine } from "src/entities/viewer/hd-lane-line.entity";
import { HdLane } from "src/entities/ushr-format/hd-lane.entity";
import { HdSdRoadLink } from "src/entities/viewer/hd-sd-road-link.entity";
import { SdRoadName } from "src/entities/sdmap/road-name.entity";
import { SchemaRelation } from "src/entities/version/schema-relation.entity";
import { updateSchemaForEntities } from "./common/entity-utils";

export class RoadHdLaneLine implements PBFLib, GeoJsonLib {
  readonly sourceId = MAP_SOURCE.HD_LANE_LINE;

  createPropertiesQuery(query: SelectQueryBuilder<any>, condition: { roadName?: string }, schemaRelation: SchemaRelation) {
    // 指定したエンティティのスキーマ名に対してバージョン情報を付与
    const entityNames = [HdLaneLine.name, HdLane.name, HdSdRoadLink.name, SdRoadName.name];
    updateSchemaForEntities(query, entityNames, schemaRelation);

    query
      .from(HdLaneLine, "tg")
      .select("tg.roadSegmentId", "roadSegmentId")
      .addSelect("tg.ordinalId", "ordinalId")
      .addSelect("tg.minSequence", "minSeq")
      .addSelect("tg.maxSequence", "maxSeq")
      .addSelect("COALESCE(tg.linkId, -1)", "linkId")
      .addSelect("COALESCE(tg.linkDirection, -1)", "direction")

      .innerJoin(HdLane, "lane", "lane.roadSegmentId = tg.roadSegmentId AND lane.ordinalId = tg.ordinalId")
      .addSelect("lane.width", "width")
      .addSelect("lane.color", "color")
      .addSelect("lane.type", "type")

      .leftJoin(HdSdRoadLink, "sd", "sd.linkId = tg.linkId AND sd.linkDirection = tg.linkDirection")
      .addSelect("COALESCE(sd.roadClassCode, -1)", "classCode")
      .addSelect("COALESCE(sd.roadNameCode, -1)", "nameCode");

    RoadName.addFilterRoadNameQuery(query, condition.roadName);

    return query;
  }
}
