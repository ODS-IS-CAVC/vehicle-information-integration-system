import { Column, Entity, PrimaryColumn } from "typeorm";

/**
 * 工事行事予定情報
 */
@Entity({ schema: "traffic_link", name: "table01" })
export class ConstructionEvent {
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

  @Column("integer", { name: "column08" })
  downstreamKp: number;

  @Column("double precision", { name: "column09" })
  downstreamLatitude: number;

  @Column("double precision", { name: "column10" })
  downstreamLongitude: number;

  @Column("double precision", { name: "column11" })
  downstreamHeight: number;

  @Column("double precision", { name: "column12" })
  downstreamDistance: number;

  @Column("integer", { name: "column13" })
  upstreamKp: number;

  @Column("double precision", { name: "column14" })
  upstreamLatitude: number;

  @Column("double precision", { name: "column15" })
  upstreamLongitude: number;

  @Column("double precision", { name: "column16" })
  upstreamHeight: number;

  @Column("double precision", { name: "column17" })
  upstreamDistance: number;

  @Column({ type: "character varying", length: 8, name: "column18" })
  laneCategory: string;

  @Column("timestamp with time zone", { name: "column19" })
  plannedStartTimestamp: Date;

  @Column("timestamp with time zone", { name: "column20" })
  plannedEndTimestamp: Date;

  @Column("timestamp with time zone", { name: "column21" })
  endTimestamp: Date;

  @Column("text", { name: "column22" })
  detour1: string;

  @Column("text", { name: "column23" })
  detour2: string;

  @Column("boolean", { name: "column24" })
  isCurrentStatus: boolean;
}
