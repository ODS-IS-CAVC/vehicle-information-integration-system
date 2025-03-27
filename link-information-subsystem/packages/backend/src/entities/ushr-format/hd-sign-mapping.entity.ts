import { Column, Entity, PrimaryColumn } from "typeorm";

/**
 * 信号・標識レーンマッピング
 */
@Entity({ schema: "ushr_format", name: "sign_lane_mapping" })
export class HdSignMapping {
  @PrimaryColumn({ name: "sign_id" })
  signId: number;

  @PrimaryColumn("int", { name: "road_segment_id" })
  roadSegmentId: number;

  @PrimaryColumn("smallint", { name: "lane_number" })
  laneNumber: number;

  @Column("smallint", { name: "lane_point_sequence_index" })
  sequence: number;
}
