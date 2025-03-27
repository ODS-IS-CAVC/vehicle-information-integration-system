import { SelectQueryBuilder } from "typeorm";
import { GeoJsonLib } from "../../shares/geojson.lib.interface";
import { MAP_SOURCE } from "src/consts/map.const";
import { PBFLib } from "../../shares/pbf/pbf.interface";
import { HdSdRelation } from "src/entities/himozuke/hd-sd-relation.entity";
import { HdSdRoadLink } from "src/entities/viewer/hd-sd-road-link.entity";
import { HdPavementMarking } from "src/entities/ushr-format/hd-pavement-marking.entity";
import { HdPavementMarkingMapping } from "src/entities/ushr-format/hd-pavement-marking-mapping.entity";
import { RoadName } from "./common/road-name";
import { SdRoadName } from "src/entities/sdmap/road-name.entity";
import { SchemaRelation } from "src/entities/version/schema-relation.entity";
import { updateSchemaForEntities } from "./common/entity-utils";

export class RoadHdPavementMarking implements PBFLib, GeoJsonLib {
  readonly sourceId = MAP_SOURCE.HD_PAVEMENT_MARKING;

  createPropertiesQuery(query: SelectQueryBuilder<any>, condition: { roadName?: string }, schemaRelation: SchemaRelation) {
    // 指定したエンティティのスキーマ名に対してバージョン情報を付与
    const entityNames = [HdPavementMarking.name, HdPavementMarkingMapping.name, HdSdRelation.name, HdSdRoadLink.name, SdRoadName.name];
    updateSchemaForEntities(query, entityNames, schemaRelation);

    query
      .from(HdPavementMarking, "tg")
      .innerJoin(
        (qb) => {
          const subQuery = qb
            .subQuery()
            .from(HdPavementMarkingMapping, "mapping")
            .leftJoin(
              HdSdRelation,
              "rel",
              ["rel.roadSegmentId = mapping.roadSegmentId", "rel.laneNumber = mapping.laneNumber", "rel.sequence = mapping.sequence"].join(
                " AND ",
              ),
            )
            .leftJoin(HdSdRoadLink, "sd", "sd.linkId = rel.linkId")

            .select("mapping.pavementMarkingId", "pavementMarkingId")
            .groupBy("mapping.pavementMarkingId")
            .addSelect("ARRAY_AGG(DISTINCT mapping.roadSegmentId)", "roadSegmentId")
            .addSelect("ARRAY_AGG(DISTINCT sd.roadClassCode)", "classCodes")
            .addSelect("ARRAY_AGG(DISTINCT sd.roadNameCode)", "nameCodes");

          RoadName.addFilterRoadNameQuery(subQuery, condition.roadName);

          return subQuery;
        },
        "sub",
        '"sub"."pavementMarkingId" = tg.id',
      )

      .select("tg.id", "id")
      .addSelect("tg.markingType", "type")
      .addSelect(`COALESCE("sub"."roadSegmentId", '{}')`, "roadSegmentIds")
      .addSelect(
        `(SELECT COALESCE(ARRAY_AGG(CONCAT('_', CAST(a as varchar), '_')), '{}') FROM unnest("sub"."classCodes") a WHERE a IS NOT NULL)`,
        "classCodes",
      )
      .addSelect(`(SELECT COALESCE(ARRAY_AGG(a), '{}') FROM unnest("sub"."nameCodes") a WHERE a IS NOT NULL)`, "nameCodes");

    return query;
  }
}
