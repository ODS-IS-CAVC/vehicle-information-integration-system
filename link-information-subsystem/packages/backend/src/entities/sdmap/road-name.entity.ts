import { Column, Entity, PrimaryColumn } from "typeorm";

/**
 * 路線名称テーブル
 */
@Entity({ schema: "sdmap", name: "table10" })
export class SdRoadName {
  @PrimaryColumn("int", { name: "column02" })
  roadCode: number;

  @Column("varchar", { name: "column03" })
  displayName: string;

  @Column("varchar", { name: "column05" })
  officialName: string;
}
