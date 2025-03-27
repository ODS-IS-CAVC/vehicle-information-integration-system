import { Column, Entity, Point, PrimaryColumn } from "typeorm";

/**
 * 信号・標識
 */
@Entity({ schema: "ushr_format", name: "signs" })
export class HdSign {
  @PrimaryColumn({ name: "sign_id" })
  id: number;

  @Column("int", { name: "shape" })
  shape: number;

  @Column("int", { name: "type" })
  type: number;

  @Column("geometry", { name: "centroid_position", spatialFeatureType: "Point", srid: 6697 })
  geom: Point;
}
