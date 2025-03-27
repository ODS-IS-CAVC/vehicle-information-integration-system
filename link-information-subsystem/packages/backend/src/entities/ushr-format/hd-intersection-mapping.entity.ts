import { Entity, PrimaryColumn } from "typeorm";

/**
 * HD: 交差点
 */
@Entity({ schema: "ushr_format", name: "intersection_road_segment_mapping" })
export class HdIntersectionMapping {
  @PrimaryColumn({ name: "intersection_id" })
  intersectionId: number;

  @PrimaryColumn({ name: "road_segment_id" })
  roadSegmentId: number;
}
