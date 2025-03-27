import { SelectQueryBuilder } from "typeorm";
import { MAP_SOURCE } from "src/consts/map.const";
import { PBFLib } from "../../shares/pbf/pbf.interface";
import { updateSchemaForEntities } from "./common/entity-utils";
import { SchemaRelation } from "src/entities/version/schema-relation.entity";
import { MergedLink } from "src/entities/sdmap/merged-link.entity";

export class RoadSdLink implements PBFLib {
  readonly sourceId = MAP_SOURCE.SD_ROAD_LINK;

  createPropertiesQuery(query: SelectQueryBuilder<any>, {}, schemaRelation: SchemaRelation): SelectQueryBuilder<any> {
    // 指定したエンティティのスキーマ名に対してバージョン情報を付与
    const entityNames = [MergedLink.name];
    updateSchemaForEntities(query, entityNames, schemaRelation);

    return query
      .from(MergedLink, "tg")
      .select("tg.objectid", "objectid")
      .addSelect("tg.fromNodeId", "fromNodeId")
      .addSelect("tg.toNodeId", "toNodeId")
      .addSelect("tg.roadNameCode", "nameCode")
      .addSelect("tg.roadClassCode", "classCode");
  }
}
