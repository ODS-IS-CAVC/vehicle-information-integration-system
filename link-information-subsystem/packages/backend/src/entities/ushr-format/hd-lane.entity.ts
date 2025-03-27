import { Column, Entity, PrimaryColumn } from "typeorm";

/**
 * HD: 路面標示レーンマッピング
 */
@Entity({ schema: "ushr_format", name: "lane_lines" })
export class HdLane {
  @PrimaryColumn("int", { name: "road_segment_id" })
  roadSegmentId: number;

  @PrimaryColumn("smallint", { name: "lane_line_ordinal_id" })
  ordinalId: number;

  @Column("integer", { name: "lane_line_type_attribute" })
  type: number;

  @Column("integer", { name: "lane_line_color_attribute" })
  color: number;

  @Column("integer", { name: "lane_line_width_attribute" })
  width: number;
}
