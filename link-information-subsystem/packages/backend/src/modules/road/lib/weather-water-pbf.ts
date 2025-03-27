import { SelectQueryBuilder } from "typeorm";
import { MAP_SOURCE } from "src/consts/map.const";
import { PBFLib } from "../../shares/pbf/pbf.interface";
import { HdSdRoadLink } from "src/entities/viewer/hd-sd-road-link.entity";
import { RoadName } from "./common/road-name";
import { SdRoadName } from "src/entities/sdmap/road-name.entity";
import { SchemaRelation } from "src/entities/version/schema-relation.entity";
import { updateSchemaForEntities } from "./common/entity-utils";
import { WaterFilmThickness } from "src/entities/weather_risk/water_film_thickness";

export class WeatherWaterPBF implements PBFLib {
  readonly sourceId = MAP_SOURCE.WATER_FILM_THICKNESS;

  createPropertiesQuery(
    query: SelectQueryBuilder<any>,
    condition: { roadName?: string; timestamp?: string; startTimestamp?: string; endTimestamp?: string },
    schemaRelation: SchemaRelation,
  ) {
    // 指定したエンティティのスキーマ名に対してバージョン情報を付与
    const entityNames = [HdSdRoadLink.name, SdRoadName.name];
    updateSchemaForEntities(query, entityNames, schemaRelation);

    query
      .from(WaterFilmThickness, "tg")
      .select("tg.roadSegmentId", "roadSegmentId")
      .addSelect("tg.laneNumber", "laneNumber")
      .addSelect("COALESCE(tg.linkId, -1)", "linkId")
      .addSelect("COALESCE(tg.linkDirection, -1)", "direction")
      .addSelect("tg.waterFilms", "waterFilms")
      .leftJoin(HdSdRoadLink, "sd", "sd.linkId = tg.linkId AND sd.linkDirection = tg.linkDirection");

    // 道路名絞込
    RoadName.addFilterRoadNameQuery(query, condition.roadName);

    return query;
  }
}
