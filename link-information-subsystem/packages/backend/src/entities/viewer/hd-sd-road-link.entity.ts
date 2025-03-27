import { BaseEntity, Column, Entity, PrimaryColumn } from "typeorm";

/**
 * HD-SDリンクデータ（GUI)
 */
@Entity({ schema: "viewer", name: "hd_sd_road_links" })
export class HdSdRoadLink extends BaseEntity {
  @PrimaryColumn("int", { name: "link_id" })
  linkId: number;

  @PrimaryColumn("smallint", { name: "link_direction" })
  linkDirection: number;

  @Column("int", { name: "from_node_id" })
  fromNodeId: number;

  @Column("int", { name: "to_node_id" })
  toNodeId: number;

  @Column("int", { name: "road_class_code" })
  roadClassCode: number;

  @Column("int", { name: "road_name_code" })
  roadNameCode: number;

  @Column("smallint", { name: "has_nopass" })
  hasNopass: number;

  @Column("smallint", { name: "has_noturn" })
  hasNoturn: number;

  @Column("smallint", { name: "has_oneway" })
  hasOneway: number;

  @Column("smallint", { name: "has_speed" })
  hasSpeed: number;

  @Column("smallint", { name: "has_zone30" })
  hasZone30: number;
}
