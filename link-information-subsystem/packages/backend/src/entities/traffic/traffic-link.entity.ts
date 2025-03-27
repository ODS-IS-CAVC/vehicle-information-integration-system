import { Column, Entity, PrimaryColumn } from "typeorm";

/**
 * 渋滞規制情報-リンク情報合同テーブル
 */
@Entity({ schema: "traffic_link", name: "table08" })
export class TrafficLink {
  @PrimaryColumn("integer", { name: "column01" })
  trafficLinkId: number;

  @PrimaryColumn("integer", { name: "column02" })
  trafficSeq: number;

  @Column("timestamp with time zone", { name: "column03" })
  provideDatetime: Date;

  @Column("numeric", { name: "column04" })
  eventNo: number;

  @Column("text", { name: "column05" })
  routeName: string;

  @Column("text", { name: "column06" })
  directionName: string;

  @Column("text", { name: "column07" })
  cause: string;

  @Column("text", { name: "column08" })
  regulation: string;

  @Column("smallint", { name: "column09" })
  severity: number;

  @Column("integer", { name: "column10" })
  length: number;

  @Column("double precision", { name: "column11" })
  downstreamLatitude: number;

  @Column("double precision", { name: "column12" })
  downstreamLongitude: number;

  @Column("double precision", { name: "column13" })
  downstreamHeight: number;

  @Column("double precision", { name: "column14" })
  downstreamDistance: number;

  @Column("double precision", { name: "column15" })
  upstreamLatitude: number;

  @Column("double precision", { name: "column16" })
  upstreamLongitude: number;

  @Column("double precision", { name: "column17" })
  upstreamHeight: number;

  @Column("double precision", { name: "column18" })
  upstreamDistance: number;

  @Column("integer", { name: "column19" })
  downstreamKp: number;

  @Column("integer", { name: "column20" })
  upstreamKp: number;

  @Column({ type: "character varying", length: 8, name: "column21" })
  laneCategory: string;

  @Column("timestamp with time zone", { name: "column22" })
  plannedEndTimestamp: Date;

  @Column("text", { name: "column23" })
  causeVehicleName1: string;

  @Column("smallint", { name: "column24" })
  causeVehicleNumber1: number;

  @Column("text", { name: "column25" })
  causeVehicleName2: string;

  @Column("smallint", { name: "column26" })
  causeVehicleNumber2: number;

  @Column("text", { name: "column27" })
  causeVehicleName3: string;

  @Column("smallint", { name: "column28" })
  causeVehicleNumber3: number;

  @Column("text", { name: "column29" })
  handlingStatus: string;

  @Column("text", { name: "column30" })
  prediction: string;

  @Column("timestamp with time zone", { name: "column31" })
  plannedResumeTimestamp: Date;

  @Column("integer", { name: "column32" })
  distance: number;
}
