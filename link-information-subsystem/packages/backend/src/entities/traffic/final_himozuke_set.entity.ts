import { Column, Entity, LineString, Point, PrimaryColumn } from "typeorm";

/**
 * 紐付け情報
 */
@Entity({ schema: "traffic_link", name: "table07" })
export class FinalHimozukeSet {
  @PrimaryColumn({ name: "column01" })
  id: number;

  @Column("int", { name: "column02" })
  linkId: number;

  @Column("smallint", { name: "column03" })
  trafficType: number;

  @Column("int", { name: "column04" })
  trafficLinkId: number;

  @Column("int", { name: "column05" })
  trafficSeq: number;

  @Column("smallint", { name: "column06" })
  element: number;

  @Column("geometry", { name: "column07", srid: 6697, select: false })
  geom: LineString | Point;
}
