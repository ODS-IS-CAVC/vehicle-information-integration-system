import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ schema: "traffic_link", name: "table06" })
export class EnumSet {
  @PrimaryColumn({ name: "column01" })
  id: number;

  @Column("int", { name: "column02" })
  trafficLinkId: number;

  @Column("int", { name: "column03" })
  seq: number;

  @Column("int", { name: "column04" })
  linkId: number;

  @Column("double precision", { name: "column05" })
  totalStartDistance: number;

  @Column("double precision", { name: "column06" })
  totalEndDistance: number;
}
