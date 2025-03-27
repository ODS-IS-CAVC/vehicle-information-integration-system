import { BaseEntity, Column, Entity, MultiLineString, PrimaryColumn } from "typeorm";

@Entity({ schema: "sdmap", name: "table07" })
export class MergedLink extends BaseEntity {
  @PrimaryColumn({ name: "column02" })
  objectid: number;

  @Column("int", { name: "column03" })
  fromNodeId: number;

  @Column("int", { name: "column04" })
  toNodeId: number;

  @Column("int", { name: "column05" })
  roadClassCode: number;

  @Column("int", { name: "column06" })
  naviClassCode: number;

  @Column("int", { name: "column07" })
  linkClassCode: number;

  @Column("int", { name: "column08" })
  managerClassCode: number;

  @Column("int", { name: "column09" })
  widthClassCode: number;

  @Column("int", { name: "column10" })
  wideAreaF: number;

  @Column("int", { name: "column11" })
  smarticCode: number;

  @Column("int", { name: "column12" })
  bypassF: number;

  @Column("int", { name: "column13" })
  caronlyF: number;

  @Column("int", { name: "column14" })
  isLandF: number;

  @Column("int", { name: "column15" })
  roadNo: number;

  @Column("int", { name: "column16" })
  roadNameCode: number;

  @Column("int", { name: "column17" })
  nopassCode: number;

  @Column("int", { name: "column18" })
  onewayCode: number;

  @Column("int", { name: "column19" })
  laneCount: number;

  @Column("int", { name: "column20" })
  secCode: number;

  @Column("int", { name: "column21" })
  prefCode: number;

  @Column("geometry", { name: "column01", spatialFeatureType: "MultiLineString", srid: 6697, select: false })
  geom: MultiLineString;
}
