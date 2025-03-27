import { Column, Entity, LineString, PrimaryColumn } from "typeorm";

/**
 * 区画線データ（GUI)
 */
@Entity({ schema: "viewer", name: "hd_lane_lines" })
export class HdLaneLine {
  @PrimaryColumn("int", { name: "road_segment_id" })
  roadSegmentId: number;

  @PrimaryColumn("smallint", { name: "ordinal_id" })
  ordinalId: number;

  @PrimaryColumn("smallint", { name: "min_sequence" })
  minSequence: number;

  @Column("smallint", { name: "max_sequence" })
  maxSequence: number;

  @Column("int", { name: "link_id" })
  linkId: number;

  @Column("smallint", { name: "link_direction" })
  linkDirection: number;

  @Column("int", { name: "from_node_id" })
  fromNodeId: number;

  @Column("int", { name: "to_node_id" })
  toNodeId: number;

  @Column("geometry", { name: "geom", spatialFeatureType: "LineString", srid: 6697, select: false })
  geom: LineString;
}
