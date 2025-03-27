import { Column, Entity, PrimaryColumn } from "typeorm";

/**
 * 冬季閉鎖情報
 */
@Entity({ schema: "traffic_link", name: "table10" })
export class WinterClosure {
  @PrimaryColumn("integer", { name: "column01" })
  trafficLinkId: number;

  @PrimaryColumn("integer", { name: "column02" })
  trafficSeq: number;

  @Column("timestamp with time zone", { name: "column03" })
  provideDatetime: Date;

  @Column("text", { name: "column04" })
  routeName: string;

  @Column("text", { name: "column05" })
  directionName: string;

  @Column("text", { name: "column06" })
  cause: string;

  @Column("text", { name: "column07" })
  regulation: string;

  @Column("double precision", { name: "column08" })
  downstreamLatitude: number;

  @Column("double precision", { name: "column09" })
  downstreamLongitude: number;

  @Column("double precision", { name: "column10" })
  downstreamHeight: number;

  @Column("double precision", { name: "column11" })
  downstreamDistance: number;

  @Column("double precision", { name: "column12" })
  upstreamLatitude: number;

  @Column("double precision", { name: "column13" })
  upstreamLongitude: number;

  @Column("double precision", { name: "column14" })
  upstreamHeight: number;

  @Column("double precision", { name: "column15" })
  upstreamDistance: number;

  @Column({ type: "character varying", length: 8, name: "column16" })
  laneCategory: string;

  @Column("timestamp with time zone", { name: "column17" })
  plannedStartTimestamp: Date;

  @Column("timestamp with time zone", { name: "column18" })
  plannedEndTimestamp: Date;

  @Column("timestamp with time zone", { name: "column19" })
  endTimestamp: Date;

  @Column("text", { name: "column20" })
  detour1: string;

  @Column("text", { name: "column21" })
  detour2: string;

  @Column("boolean", { name: "column22" })
  isCurrentStatus: boolean;
}
