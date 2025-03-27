import { Column, Entity, PrimaryColumn } from "typeorm";

/**
 * 全レーンHDMap・SDMap紐付け
 */
@Entity({ schema: "himozuke", name: "final_himozuke_hd_sd_set" })
export class HdSdRelation {
  @Column("int", { name: "sd_link_id" })
  linkId: number;

  @Column("int", { name: "sd_from_node" })
  fromNodeId: number;

  @Column("int", { name: "sd_to_node" })
  toNodeId: number;

  @PrimaryColumn("smallint", { name: "segment_sequence" })
  sequence: number;

  @PrimaryColumn({ name: "road_segment_id" })
  roadSegmentId: number;

  @PrimaryColumn("int", { name: "lane_number" })
  laneNumber: number;
}
