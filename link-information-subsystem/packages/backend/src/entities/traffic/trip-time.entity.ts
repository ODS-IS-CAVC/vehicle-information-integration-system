import { Column, Entity, PrimaryColumn } from "typeorm";

/**
 * 旅行時間情報
 */
@Entity({ schema: "traffic_link", name: "table09" })
export class TripTime {
  @PrimaryColumn("int", { name: "column01" })
  trafficLinkId: number;

  @PrimaryColumn("int", { name: "column02" })
  trafficSeq: number;

  @Column("timestamp with time zone", { name: "column03" })
  provideDatetime: Date;

  @Column("double precision", { name: "column04" })
  startpointLatitude: number;

  @Column("double precision", { name: "column05" })
  startpointLongitude: number;

  @Column("double precision", { name: "column06" })
  startpointHeight: number;

  @Column("double precision", { name: "column07" })
  endpointLatitude: number;

  @Column("double precision", { name: "column08" })
  endpointLongitude: number;

  @Column("double precision", { name: "column09" })
  endpointHeight: number;

  @Column("int", { name: "column10" })
  startpointKp: number;

  @Column("int", { name: "column11" })
  endpointKp: number;

  @Column("int", { name: "column12" })
  travelTime: number;
}
