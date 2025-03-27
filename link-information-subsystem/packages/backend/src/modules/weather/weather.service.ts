import { BadRequestException, Injectable } from "@nestjs/common";
import { CropMap } from "../shares/crop/crop";
import { CoordinateService } from "../util/coordinate.service";
import { DataSource } from "typeorm";
import { InjectDataSource } from "@nestjs/typeorm";
import { getBBox, ZFXYTile } from "src/ouranos-gex-lib/src/zfxy";
import { SchemaRelationService } from "../util/schema-relation.service";
import { RoadName } from "../road/lib/common/road-name";
import { Convert } from "../shares/lib/convert";
import { LoggerService } from "../util/logger/logger.service";
import { WaterFilmThickness } from "src/entities/weather_risk/water_film_thickness";
import { Wind } from "src/entities/weather_risk/wind";
import { SdRoadName } from "src/entities/sdmap/road-name.entity";
import { updateSchemaForEntities } from "../road/lib/common/entity-utils";
import { HdSdRoadLink } from "src/entities/viewer/hd-sd-road-link.entity";

@Injectable()
export class WeatherService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly coordinateService: CoordinateService,
    private readonly schemaRelationService: SchemaRelationService,
    private readonly loggerService: LoggerService,
  ) {}
  /**
   * 気象リスクデータモデル取得
   * @param condition 検索条件
   * @returns 気象リスクデータモデル
   */
  async getWeatherRisk(condition) {
    let geom;

    try {
      // bbox, city, meshの指定がない場合
      const geomKeys = ["bbox", "x", "y", "z", "f", "city", "mesh"];
      const hasGeomKeys = geomKeys.some((key) => condition?.hasOwnProperty(key));
      if (!hasGeomKeys) {
        throw new BadRequestException();
      }

      // バウンディングボックス（文字列として受け取ってしまうため、数値型の配列に変換）
      if (condition.bbox) {
        condition.bbox = String(condition.bbox).split(",").map(Number);
      }

      // 空間ID
      if (condition.x !== undefined && condition.y !== undefined && condition.z !== undefined) {
        const tile: ZFXYTile = {
          z: Number(condition.z),
          f: Number(condition.f) || 0,
          x: Number(condition.x),
          y: Number(condition.y),
        };

        // NOTE: Ouranosが用意するメソッドがオブジェクトの配列で返却するため、配列に変換
        const bbox = getBBox(tile).reduce((acc, obj) => {
          acc.push(obj.lng, obj.lat);
          return acc;
        }, []);
        condition.bbox = bbox;
      }

      // メッシュコード
      if (condition.mesh) {
        const bbox = this.coordinateService.transformMeshToBBox(condition.mesh);
        condition.bbox = bbox;
      }

      geom = await CropMap.createCropMultiPolygon(this.dataSource, {
        // バウンディングボックス
        bbox: condition.bbox,
        // 行政区画コード
        cities: condition.city,
      });

      const schemaRelation = await this.schemaRelationService.getSchemaRelation();
      const waterFilmThicknessQuery = this.dataSource.createQueryBuilder();
      const entityNames = [HdSdRoadLink.name, SdRoadName.name];
      updateSchemaForEntities(waterFilmThicknessQuery, entityNames, schemaRelation);
      waterFilmThicknessQuery
        .from(WaterFilmThickness, "wf")
        .select("wf.roadSegmentId", "roadSegmentId")
        .addSelect("wf.laneNumber", "laneNumber")
        .addSelect("COALESCE(wf.linkId, -1)", "linkId")
        .addSelect("COALESCE(wf.linkDirection, -1)", "direction")
        .addSelect("wf.waterFilms", "waterFilms")
        .leftJoin(HdSdRoadLink, "sd", "sd.linkId = wf.linkId AND sd.linkDirection = wf.linkDirection");

      // 道路名絞込
      RoadName.addFilterRoadNameQuery(waterFilmThicknessQuery, condition.roadName);

      waterFilmThicknessQuery
        .addSelect(`ST_AsGeoJSON(ST_Intersection(ST_Transform(ST_GeomFromGeoJSON(:geojsonString), 6697), wf.geom))`, "geometry")
        .andWhere(`ST_Intersects(ST_Transform(ST_GeomFromGeoJSON(:geojsonString),6697), wf.geom)`)
        .setParameter("geojsonString", JSON.stringify(geom));
      const waterFilmThickness = await waterFilmThicknessQuery.getRawMany();

      const windQuery = this.dataSource.createQueryBuilder();
      updateSchemaForEntities(windQuery, entityNames, schemaRelation);
      windQuery
        .from(Wind, "wi")
        .select("wi.roadSegmentId", "roadSegmentId")
        .addSelect("COALESCE(wi.linkId, -1)", "linkId")
        .addSelect("COALESCE(wi.linkDirection, -1)", "direction")
        .addSelect("wi.windSpeed", "windSpeed")
        .addSelect("wi.windDirection", "windDirection")
        .leftJoin(HdSdRoadLink, "sd", "sd.linkId = wi.linkId AND sd.linkDirection = wi.linkDirection");

      // 道路名絞込
      RoadName.addFilterRoadNameQuery(windQuery, condition.roadName);

      windQuery
        .addSelect(`ST_AsGeoJSON(ST_Intersection(ST_Transform(ST_GeomFromGeoJSON(:geojsonString), 6697), wi.geom))`, "geometry")
        .andWhere(`ST_Intersects(ST_Transform(ST_GeomFromGeoJSON(:geojsonString),6697), wi.geom)`)
        .setParameter("geojsonString", JSON.stringify(geom));
      const wind = await windQuery.getRawMany();
      if (waterFilmThickness.length === 0 && wind.length === 0) {
        return {
          type: "FeatureCollection",
          features: [],
        };
      }
      const result: any[] = [...waterFilmThickness, ...wind];
      const geojson = Convert.rowsToGeojson(result);
      return geojson;
    } catch (e) {
      this.loggerService.error(e);
      throw e;
    }
  }
}
