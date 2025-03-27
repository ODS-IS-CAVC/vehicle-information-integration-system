import { SelectQueryBuilder } from "typeorm";
import { MAP_SOURCE } from "src/consts/map.const";
import { PBFLib } from "../../shares/pbf/pbf.interface";
import { SdRoadNode } from "src/entities/sdmap/road-node.entity";
import { updateSchemaForEntities } from "./common/entity-utils";
import { SchemaRelation } from "src/entities/version/schema-relation.entity";

export class RoadSdNode implements PBFLib {
  readonly sourceId = MAP_SOURCE.SD_ROAD_NODE;

  /**
   * 件数取得・Geojson用データ取得の共通条件セット
   *
   * @param query
   * @param userFileExport
   * @returns
   */
  createPropertiesQuery(query: SelectQueryBuilder<any>, {}, schemaRelation: SchemaRelation): SelectQueryBuilder<any> {
    // 指定したエンティティのスキーマ名に対してバージョン情報を付与
    const entityNames = [SdRoadNode.name];
    updateSchemaForEntities(query, entityNames, schemaRelation);

    return query.from(SdRoadNode, "tg").select("tg.id", "nodeId");
  }
}
