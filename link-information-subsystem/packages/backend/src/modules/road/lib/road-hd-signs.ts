import { SelectQueryBuilder } from "typeorm";
import { GeoJsonLib } from "src/modules/shares/geojson.lib.interface";
import { MAP_SOURCE } from "src/consts/map.const";
import { PBFLib } from "../../shares/pbf/pbf.interface";
import { HdSdRelation } from "src/entities/himozuke/hd-sd-relation.entity";
import { HdSdRoadLink } from "src/entities/viewer/hd-sd-road-link.entity";
import { HdSignMapping } from "src/entities/ushr-format/hd-sign-mapping.entity";
import { HdSign } from "src/entities/ushr-format/hd-sign.entity";
import { RoadName } from "./common/road-name";
import { SdRoadName } from "src/entities/sdmap/road-name.entity";
import { SchemaRelation } from "src/entities/version/schema-relation.entity";
import { updateSchemaForEntities } from "./common/entity-utils";

export class RoadHdSign implements PBFLib, GeoJsonLib {
  readonly sourceId = MAP_SOURCE.HD_SIGN;

  createPropertiesQuery(query: SelectQueryBuilder<any>, condition: { roadName?: string }, schemaRelation: SchemaRelation) {
    // 指定したエンティティのスキーマ名に対してバージョン情報を付与
    const entityNames = [HdSign.name, HdSignMapping.name, HdSdRelation.name, HdSdRoadLink.name, SdRoadName.name];
    updateSchemaForEntities(query, entityNames, schemaRelation);

    query
      .from(HdSign, "tg")
      .innerJoin(
        (qb) => {
          const subQuery = qb
            .subQuery()
            .from(HdSignMapping, "mapping")
            .leftJoin(
              HdSdRelation,
              "rel",
              ["rel.roadSegmentId = mapping.roadSegmentId", "rel.laneNumber = mapping.laneNumber", "rel.sequence = mapping.sequence"].join(
                " AND ",
              ),
            )
            .leftJoin(HdSdRoadLink, "sd", "sd.linkId = rel.linkId")

            .select("mapping.signId", "signId")
            .groupBy("mapping.signId")
            .addSelect("ARRAY_AGG(DISTINCT mapping.roadSegmentId)", "roadSegmentId")
            .addSelect("ARRAY_AGG(DISTINCT sd.roadClassCode)", "classCodes")
            .addSelect("ARRAY_AGG(DISTINCT sd.roadNameCode)", "nameCodes");

          RoadName.addFilterRoadNameQuery(subQuery, condition.roadName);

          return subQuery;
        },
        "sub",
        '"sub"."signId" = tg.id',
      )

      .select("tg.id", "id")
      .addSelect("tg.type", "type")
      .addSelect("tg.shape", "shape")
      .addSelect(`COALESCE("sub"."roadSegmentId", '{}')`, "roadSegmentIds")
      .addSelect(
        `(SELECT COALESCE(ARRAY_AGG(CONCAT('_', CAST(a as varchar), '_')), '{}') FROM unnest("sub"."classCodes") a WHERE a IS NOT NULL)`,
        "classCodes",
      )
      .addSelect(`(SELECT COALESCE(ARRAY_AGG(a), '{}') FROM unnest("sub"."nameCodes") a WHERE a IS NOT NULL)`, "nameCodes");

    return query;
  }
}
