import { Column, Entity, PrimaryColumn } from "typeorm";

/**
 * 路面標示レーンマッピング
 */
@Entity({ schema: "ushr_format", name: "pavement_marking_lane_mapping" })
export class HdPavementMarkingMapping {
  @PrimaryColumn({ name: "pavement_marking_id" })
  pavementMarkingId: number;

  @PrimaryColumn("int", { name: "road_segment_id" })
  roadSegmentId: number;

  @PrimaryColumn("smallint", { name: "lane_number" })
  laneNumber: number;

  @Column("smallint", { name: "lane_point_sequence_index" })
  sequence: number;
}
