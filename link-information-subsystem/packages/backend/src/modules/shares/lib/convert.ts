import { Geometry } from "geojson";
import { FeatureCollectionDto, FeatureDto } from "src/modules/road/dto/road.dto";

export class Convert {
  /**
   * DBから取得したデータをGeoJSON形式に変換
   *
   * @param rows
   * @returns
   */
  static rowsToGeojson<T>(rows: { geometry: Geometry | string; [key: string]: any }[]): FeatureCollectionDto<T> {
    return {
      type: "FeatureCollection",
      features: rows.map((row) => {
        const { geometry, ...properties } = row;
        return {
          type: "Feature",
          geometry: typeof geometry === "string" ? JSON.parse(geometry) : geometry,
          properties: properties as T,
        } as FeatureDto<T>;
      }),
    };
  }
}
