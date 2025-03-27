import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ schema: "version", name: "schema_relations" })
export class SchemaRelation extends BaseEntity {
  @PrimaryGeneratedColumn({ name: "record_id" })
  recordId: number;

  @Column("integer", { name: "viewer_version" })
  viewerVersion: number;

  @Column("integer", { name: "hdmap_version" })
  hdmapVersion: number;

  @Column("integer", { name: "sdmap_version" })
  sdmapVersion: number;

  @Column("integer", { name: "himozuke_version" })
  himozukeVersion: number;

  @Column("timestamp", { name: "created_at" })
  createdAt: Date;

  @Column("timestamp", { name: "updated_at" })
  updatedAt: Date;
}
