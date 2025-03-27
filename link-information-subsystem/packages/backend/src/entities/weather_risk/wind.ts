import { Column, Entity, LineString, PrimaryColumn } from "typeorm";

/**
 * 風向・風圧データ（GUI）
 */
@Entity({ schema: "weather_risk", name: "wind" })
export class Wind {
  @PrimaryColumn("int", { name: "road_segment_id" })
  roadSegmentId: number;

  @Column("int", { name: "link_id" })
  linkId: number;

  @Column("smallint", { name: "link_direction" })
  linkDirection: number;

  @Column("double precision", { name: "wind_speed" })
  windSpeed: number;

  @Column("double precision", { name: "wind_direction" })
  windDirection: number;

  @Column("geometry", { name: "geom", srid: 6697 })
  geom: LineString;

  @Column("timestamp", { name: "created_at" })
  createdAt: Date;

  @Column("timestamp", { name: "updated_at" })
  updatedAt: Date;
}
