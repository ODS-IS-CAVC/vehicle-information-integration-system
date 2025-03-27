import { MultiPolygon } from "geojson";
import { PrefCity } from "src/entities/share/pref-cities.entity";
import { DataSource } from "typeorm";
import { UnprocessableEntityException } from "@nestjs/common";

export class CropMap {
  /**
   * 切取り範囲取得
   *
   * @param condition
   * @throws UnprocessableEntityException
   */
  static async createCropMultiPolygon(dataSource: DataSource, condition: any): Promise<MultiPolygon> {
    let geometry: any;
    if (condition.bbox) {
      const [s, w, n, e] = condition.bbox;
      geometry = {
        type: "Polygon",
        coordinates: [
          [
            [+s, +w],
            [+s, +e],
            [+n, +e],
            [+n, +w],
            [+s, +w],
          ],
        ],
      };
    } else if (condition.cities) {
      geometry = await this.createMultiPolygonByCities(dataSource, condition.cities);
    }

    if (!geometry || geometry.coordinates.length === 0 || !geometry.type.endsWith("Polygon")) {
      throw new UnprocessableEntityException();
    }

    return geometry.type === "MultiPolygon" ? geometry : { type: "MultiPolygon", coordinates: [geometry.coordinates] };
  }

  /**
   * 行政区画一覧から、切り出し範囲のMultiPolygonを取得
   */
  static async createMultiPolygonByCities(dataSource: DataSource, city: string) {
    const query = dataSource
      .createQueryBuilder()
      .select("ST_AsGeoJSON(ST_Transform(ST_Union(pc.geom), 6697))", "geom")
      .from(PrefCity, "pc")
      .where("pc.prefCityCode = :city", { city });

    const row = await query.getRawOne();

    return JSON.parse(row.geom);
  }
}
