import { SdRoadName } from "src/entities/sdmap/road-name.entity";
import { SelectQueryBuilder } from "typeorm";
import { MergedLink } from "src/entities/sdmap/merged-link.entity";
import { Geometry } from "geojson";

export class GeometryIntersection {
  static getRoadNameAndGeomIntersection(query: SelectQueryBuilder<any>, geom: Geometry, roadName: string) {
    // 道路名からGeometry情報を取得し、ST_Intersectionで共通部分のGeometry情報取得
    return query
      .from(MergedLink, "ml")
      .select(`ST_AsGeoJSON(ST_Intersection(ST_Transform(ST_GeomFromGeoJSON(:geojsonString), 6697), ml.geom))`, "intersection")
      .innerJoin(SdRoadName, "rn", "rn.roadCode = ml.roadNameCode")
      .andWhere("(rn.displayName LIKE :roadName OR rn.officialName LIKE :roadName)")
      .andWhere(`ST_Intersects(ST_Transform(ST_GeomFromGeoJSON(:geojsonString), 6697), ml.geom)`, {
        geojsonString: JSON.stringify(geom),
      })
      .setParameter("geojsonString", JSON.stringify(geom))
      .setParameter("roadName", `%${roadName}%`);
  }
}
