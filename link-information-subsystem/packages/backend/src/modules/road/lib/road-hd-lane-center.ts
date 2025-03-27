import { MAP_SOURCE, RoadRegulationType } from "src/consts/map.const";
import { HdSdRoadLink } from "src/entities/viewer/hd-sd-road-link.entity";
import { HdLaneCenterLine } from "src/entities/viewer/hd-lane-center-line.entity";
import { SdRoadName } from "src/entities/sdmap/road-name.entity";
import { SelectQueryBuilder } from "typeorm";
import { GeoJsonLib } from "../../shares/geojson.lib.interface";
import { PBFLib } from "../../shares/pbf/pbf.interface";
import { RoadName } from "./common/road-name";
import { SchemaRelation } from "src/entities/version/schema-relation.entity";
import { updateSchemaForEntities } from "./common/entity-utils";

export class RoadHdLaneCenter implements PBFLib, GeoJsonLib {
  readonly sourceId = MAP_SOURCE.HD_LANE_CENTER;

  /**
   * クエリ作成
   * @param query -クエリビルダーオブジェクト
   * @param condition - クエリを絞り込むための条件
   *   @property {string} [roadName] - 道路名称
   *   @property {string} [reg] - 絞り込み対象の交通規制情報
   * @param {number} schemaRelation - スキーマの世代管理バージョン
   * @returns {SelectQueryBuilder<any>} 加工されたクエリビルダーオブジェクト
   */
  createPropertiesQuery(
    query: SelectQueryBuilder<any>,
    condition: { roadName?: string; reg?: RoadRegulationType },
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
      .addSelect("COALESCE(tg.linkDirection, -1)", "direction")

      .leftJoin(HdSdRoadLink, "sd", "sd.linkId = tg.linkId AND sd.linkDirection = tg.linkDirection")
      .addSelect("COALESCE(sd.roadClassCode, -1)", "classCode")
      .addSelect("COALESCE(sd.roadNameCode, -1)", "nameCode")
      .addSelect("COALESCE(sd.hasNopass, 0)", "hasNopass")
      .addSelect("COALESCE(sd.hasNoturn, 0)", "hasNoturn")
      .addSelect("COALESCE(sd.hasOneway, 0)", "hasOneway")
      .addSelect("COALESCE(sd.hasSpeed, 0)", "hasSpeed")
      .addSelect("COALESCE(sd.hasZone30, 0)", "hasZone30");

    // 道路名絞込
    RoadName.addFilterRoadNameQuery(query, condition.roadName);

    // 交通規制情報絞込
    if (condition?.reg) {
      const columnName = `sd.has_${condition.reg.toLowerCase()}`;
      query.andWhere(`${columnName} = :${condition.reg}`, { [condition.reg]: 1 });
    }

    return query;
  }
}
