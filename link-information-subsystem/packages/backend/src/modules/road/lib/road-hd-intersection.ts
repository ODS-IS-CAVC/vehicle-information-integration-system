import { SelectQueryBuilder } from "typeorm";
import { GeoJsonLib } from "../../shares/geojson.lib.interface";
import { PBFLib } from "../../shares/pbf/pbf.interface";
import { HdSdRoadLink } from "src/entities/viewer/hd-sd-road-link.entity";
import { HdIntersectionMapping } from "src/entities/ushr-format/hd-intersection-mapping.entity";
import { HdIntersection } from "src/entities/ushr-format/hd-intersection.entity";
import { HdLaneCenterLine } from "src/entities/viewer/hd-lane-center-line.entity";
import { RoadName } from "./common/road-name";
import { MAP_SOURCE } from "src/consts/map.const";
import { SdRoadName } from "src/entities/sdmap/road-name.entity";
import { SchemaRelation } from "src/entities/version/schema-relation.entity";
import { updateSchemaForEntities } from "./common/entity-utils";

export class RoadHdIntersection implements PBFLib, GeoJsonLib {
  readonly sourceId = MAP_SOURCE.HD_INTERSECTION;

  createPropertiesQuery(query: SelectQueryBuilder<any>, condition: { roadName?: string }, schemaRelation: SchemaRelation) {
    // 指定したエンティティのスキーマ名に対してバージョン情報を付与
    const entityNames = [HdIntersection.name, HdIntersectionMapping.name, HdLaneCenterLine.name, HdSdRoadLink.name, SdRoadName.name];
    updateSchemaForEntities(query, entityNames, schemaRelation);

    query
      .from(HdIntersection, "tg")
      .innerJoin(
        (qb) => {
          const subQuery = qb
            .subQuery()
            .from(HdIntersectionMapping, "mapping")
            .innerJoin(HdLaneCenterLine, "line", "line.roadSegmentId = mapping.roadSegmentId")
            .leftJoin(HdSdRoadLink, "sd", "sd.linkId = line.linkId AND sd.linkDirection = line.linkDirection")

            .select("mapping.intersectionId", "intersectionId")
            .groupBy("mapping.intersectionId")
            .addSelect("ARRAY_AGG(DISTINCT mapping.roadSegmentId)", "roadSegmentId")
            .addSelect("ARRAY_AGG(DISTINCT sd.roadClassCode)", "classCodes")
            .addSelect("ARRAY_AGG(DISTINCT sd.roadNameCode)", "nameCodes");

          RoadName.addFilterRoadNameQuery(subQuery, condition.roadName);

          return subQuery;
        },
        "sub",
        '"sub"."intersectionId" = tg.id',
      )

      .select("tg.id", "id")
      .addSelect(`COALESCE("sub"."roadSegmentId", '{}')`, "roadSegmentIds")
      .addSelect(
        `(SELECT COALESCE(ARRAY_AGG(CONCAT('_', CAST(a as varchar), '_')), '{}') FROM unnest("sub"."classCodes") a WHERE a IS NOT NULL)`,
        "classCodes",
      )
      .addSelect(`(SELECT COALESCE(ARRAY_AGG(a), '{}') FROM unnest("sub"."nameCodes") a WHERE a IS NOT NULL)`, "nameCodes");

    return query;
  }
}
