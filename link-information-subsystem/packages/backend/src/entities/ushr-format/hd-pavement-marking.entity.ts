import { Column, Entity, Polygon, PrimaryColumn } from "typeorm";

/**
 * 路面標示
 */
@Entity({ schema: "ushr_format", name: "pavement_markings" })
export class HdPavementMarking {
  @PrimaryColumn({ name: "pavement_marking_id" })
  id: number;

  @Column("int", { name: "marking_type" })
  markingType: number;

  @Column("geometry", { name: "pavement_marking_position", spatialFeatureType: "Polygon", srid: 6697 })
  geom: Polygon;
}
