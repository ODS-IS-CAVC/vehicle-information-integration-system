import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ schema: "assets", name: "objects_3d_operation" })
export class Objects3dOperation {
  @PrimaryColumn({ name: "id" })
  id: number;

  @Column("varchar", { name: "title" })
  title: string;

  @Column("integer", { name: "point_cloud_unique_id" })
  pointCloudUniqueId: number;

  @Column("integer", { name: "id_3d_object" })
  id3dObject: number;

  @Column("double precision", { name: "coordinates" })
  coordinates: number[];

  @Column("double precision", { name: "x_rotation" })
  xRotation: number;

  @Column("double precision", { name: "y_rotation" })
  yRotation: number;

  @Column("double precision", { name: "z_rotation" })
  zRotation: number;

  @Column("double precision", { name: "scale" })
  scale: number;

  @Column("timestamp", { name: "created_at" })
  createdAt: Date;

  @Column("timestamp", { name: "updated_at" })
  updatedAt: Date;
}
