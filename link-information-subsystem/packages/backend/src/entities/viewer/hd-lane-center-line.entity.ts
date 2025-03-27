import { Column, Entity, LineString, PrimaryColumn } from "typeorm";

/**
 * 車線中心線データ（GUI）
 */
@Entity({ schema: "viewer", name: "hd_lane_center_lines" })
export class HdLaneCenterLine {
  @PrimaryColumn("int", { name: "road_segment_id" })
  roadSegmentId: number;

  @PrimaryColumn("smallint", { name: "lane_number" })
  laneNumber: number;

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
