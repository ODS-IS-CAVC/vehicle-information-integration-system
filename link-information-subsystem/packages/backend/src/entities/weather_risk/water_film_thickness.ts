import { Column, Entity, LineString, PrimaryColumn } from "typeorm";

/**
 * 水膜厚データ（GUI）
 */
@Entity({ schema: "weather_risk", name: "water_film_thickness" })
export class WaterFilmThickness {
  @PrimaryColumn("int", { name: "road_segment_id" })
  roadSegmentId: number;

  @PrimaryColumn("smallint", { name: "lane_number" })
  laneNumber: number;

  @Column("int", { name: "link_id" })
  linkId: number;

  @Column("smallint", { name: "link_direction" })
  linkDirection: number;

  @Column("double precision", { name: "water_films" })
  waterFilms: number;

  @Column("geometry", { name: "geom", spatialFeatureType: "LineString", srid: 6697, select: false })
  geom: LineString;

  @Column("timestamp", { name: "created_at" })
  createdAt: Date;

  @Column("timestamp", { name: "updated_at" })
  updatedAt: Date;
}
