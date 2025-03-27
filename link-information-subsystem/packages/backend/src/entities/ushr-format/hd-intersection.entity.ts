import { Column, Entity, Polygon, PrimaryColumn } from "typeorm";

/**
 * HD: 交差点
 */
@Entity({ schema: "ushr_format", name: "intersection" })
export class HdIntersection {
  @PrimaryColumn({ name: "intersection_id" })
  id: number;

  @Column("geometry", { name: "geometry", spatialFeatureType: "Polygon", srid: 6697 })
  geom: Polygon;
}
