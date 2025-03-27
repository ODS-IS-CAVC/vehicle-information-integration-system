import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ schema: "share", name: "sns_error_counts" })
export class SnsErrorCount {
  @PrimaryColumn("integer", { name: "id" })
  id: number;

  @Column("varchar", { name: "type" })
  type: string;

  @Column("varchar", { name: "content" })
  content: string;

  @Column("int", { name: "threshold" })
  threshold: number;

  @Column("int", { name: "count" })
  count: number;
}
