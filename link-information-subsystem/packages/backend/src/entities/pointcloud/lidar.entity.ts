import { DateTime } from "aws-sdk/clients/devicefarm";
import { Column, Entity, PrimaryColumn, MultiLineString } from "typeorm";

@Entity({ schema: "assets", name: "lidar" })
export class Lidar {
  @PrimaryColumn({ name: "id" })
  id: number;

  @Column("text", { name: "s3_path" })
  s3Path: string;

  @Column("text", { name: "scene_name" })
  sceneName: string;

  @Column("text", { name: "key_path" })
  keyPath: string;

  @Column("integer", { name: "revision" })
  revision: number;

  @Column("integer", { name: "planar_srid" })
  planarSrid: number;

  @Column("text", { name: "pointcloud_id" })
  pointCloudId: string;

  @Column("text", { name: "converter_rev" })
  converterRev: string;

  @Column("text", { name: "metadata_version_id" })
  metadataVersionId: string;

  @Column("bigint", { name: "octree_size" })
  octreeSize: number;

  @Column("text", { name: "octree_sha256" })
  octreeSha256: string;

  @Column("text", { name: "octree_version_id" })
  octreeVersionId: string;

  @Column("bigint", { name: "hierarchy_size" })
  hierarchySize: number;

  @Column("text", { name: "hierarchy_sha256" })
  hierarchySha256: string;

  @Column("text", { name: "hierarchy_version_id" })
  hierarchyVersionId: string;

  @Column("timestamp", { name: "added_datetime" })
  addedDatetime: DateTime;

  @Column("date", { name: "acquisition_date" })
  acquisitionDate: Date;

  @Column("boolean", { name: "has_intensity" })
  hasIntensity: boolean;

  @Column("boolean", { name: "has_rgba" })
  hasRgba: boolean;

  @Column("jsonb", { name: "tags" })
  tags: JSON;

  @Column("integer", { name: "orig_srid" })
  origSrid: number;

  @Column("text", { name: "orig_laz_path" })
  origLazPath: string;

  @Column("bigint", { name: "orig_laz_size" })
  origLazSize: number;

  @Column("text", { name: "orig_laz_sha256" })
  origLazSha256: string;

  @Column("text", { name: "orig_ort_path" })
  origOrtPath: string;

  @Column("bigint", { name: "orig_ort_size" })
  origOrtSize: number;

  @Column("text", { name: "orig_ort_sha256" })
  origOrtSha256: string;

  @Column("geometry", { name: "geom", spatialFeatureType: "MultiLineString", srid: 6697 })
  geometry: MultiLineString;

  @Column("boolean", { name: "is_potree_converted" })
  isPotreeConverted: boolean;
}
