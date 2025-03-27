import { Column, Entity, LineString, PrimaryColumn } from "typeorm";

/**
 * 道路縁データ（GUI)
 */
@Entity({ schema: "viewer", name: "hd_road_edge_lines" })
export class HdRoadEdgeLine {
  @PrimaryColumn("int", { name: "road_segment_id" })
  roadSegmentId: number;

  @PrimaryColumn("boolean", { name: "is_road_edge_right" })
  isRoadEdgeRight: boolean;

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
