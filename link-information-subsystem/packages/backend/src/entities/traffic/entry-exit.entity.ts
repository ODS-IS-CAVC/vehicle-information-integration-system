import { Column, Entity, PrimaryColumn } from "typeorm";

/**
 * 入口出口閉鎖情報
 */
@Entity({ schema: "traffic_link", name: "table02" })
export class EntryExit {
  @PrimaryColumn({ name: "id" })
  id: number;

  @Column("int", { name: "column01" })
  trafficLinkId: number;

  @Column("int", { name: "column02" })
  trafficSeq: number;

  @Column("timestamp with time zone", { name: "column03" })
  provideDatetime: Date;

  @Column("double precision", { name: "column04" })
  latitude: number;

  @Column("double precision", { name: "column05" })
  longitude: number;

  @Column("double precision", { name: "column06" })
  height: number;

  @Column("text", { name: "column07" })
  routeName: string;

  @Column("text", { name: "column08" })
  directionName: string;

  @Column("text", { name: "column09" })
  name: string;

  @Column("int", { name: "column10" })
  isEntrance: number;
}
