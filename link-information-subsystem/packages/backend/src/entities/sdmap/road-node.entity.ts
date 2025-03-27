import { Column, Entity, Point, PrimaryColumn } from "typeorm";

/**
 * マージ済み道路ノード
 */
@Entity({ schema: "sdmap", name: "table08" })
export class SdRoadNode {
  @PrimaryColumn({ name: "column02" })
  id: number;

  @Column("geometry", { name: "column01", spatialFeatureType: "Point", srid: 6697 })
  geom: Point;
}
