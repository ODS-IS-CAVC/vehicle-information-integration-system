import { SelectQueryBuilder } from "typeorm";
import { GeoJsonLib } from "../../shares/geojson.lib.interface";
import { MAP_SOURCE } from "src/consts/map.const";
import { PBFLib } from "../../shares/pbf/pbf.interface";
import { HdSdRoadLink } from "src/entities/viewer/hd-sd-road-link.entity";
import { RoadName } from "./common/road-name";
import { HdRoadEdgeLine } from "src/entities/viewer/hd-road-edge-line.entity";
import { SdRoadName } from "src/entities/sdmap/road-name.entity";
import { SchemaRelation } from "src/entities/version/schema-relation.entity";
import { updateSchemaForEntities } from "./common/entity-utils";

export class RoadHdRoadEdge implements PBFLib, GeoJsonLib {
  readonly sourceId = MAP_SOURCE.HD_ROAD_EDGE;

  createPropertiesQuery(query: SelectQueryBuilder<any>, condition: { roadName?: string }, schemaRelation: SchemaRelation) {
    // 指定したエンティティのスキーマ名に対してバージョン情報を付与
    const entityNames = [HdRoadEdgeLine.name, HdSdRoadLink.name, SdRoadName.name];
    updateSchemaForEntities(query, entityNames, schemaRelation);

    query
      .from(HdRoadEdgeLine, "tg")
      .leftJoin(HdSdRoadLink, "sd", "sd.linkId = tg.linkId AND sd.linkDirection = tg.linkDirection")

      .select("tg.roadSegmentId", "roadSegmentId")
      .addSelect("tg.isRoadEdgeRight", "isRoadEdgeRight")
      .addSelect("tg.minSequence", "minSeq")
      .addSelect("tg.maxSequence", "maxSeq")

      .addSelect("COALESCE(tg.linkId, -1)", "linkId")
      .addSelect("COALESCE(tg.linkDirection, -1)", "direction")
      .addSelect("COALESCE(sd.roadClassCode, -1)", "classCode")
      .addSelect("COALESCE(sd.roadNameCode, -1)", "nameCode");

    RoadName.addFilterRoadNameQuery(query, condition.roadName);

    return query;
  }
}
