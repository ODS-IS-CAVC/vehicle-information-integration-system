import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ schema: "share", name: "point_cloud_split_manage" })
export class PointCloudSplitManage {
  @PrimaryColumn({ name: "id" })
  id: number;

  @Column("integer", { name: "user_id" })
  userId: number;

  @Column("integer", { name: "point_cloud_unique_id" })
  pointCloudUniqueId: number;

  @Column("double precision", { name: "start_lat" })
  startLat: number;

  @Column("double precision", { name: "start_lon" })
  startLon: number;

  @Column("double precision", { name: "end_lat" })
  endLat: number;

  @Column("double precision", { name: "end_lon" })
  endLon: number;

  @Column("text", { name: "s3_bucket" })
  s3Bucket: string;

  @Column("text", { name: "s3_key" })
  s3Key: string;

  @Column("varchar", { name: "filename" })
  fileName: string;

  @Column("smallint", { name: "file_status" })
  fileStatus: number;

  @Column("timestamp", { name: "created_at" })
  createdAt: Date;

  @Column("timestamp", { name: "updated_at" })
  updatedAt: Date;
}
