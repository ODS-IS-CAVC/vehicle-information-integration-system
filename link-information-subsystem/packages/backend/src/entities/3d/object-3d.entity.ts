import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ schema: "assets", name: "objects_3d" })
export class Objects3d {
  @PrimaryColumn({ name: "id" })
  id: number;

  @Column("text", { name: "s3_bucket" })
  s3Bucket: string;

  @Column("text", { name: "s3_key" })
  s3Key: string;

  @Column("varchar", { name: "title" })
  title: string;

  @Column("varchar", { name: "filename" })
  fileName: string;

  @Column("timestamp", { name: "created_at" })
  createdAt: Date;

  @Column("timestamp", { name: "updated_at" })
  updatedAt: Date;
}
