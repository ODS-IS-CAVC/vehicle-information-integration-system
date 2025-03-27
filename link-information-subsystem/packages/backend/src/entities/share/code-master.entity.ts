import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ schema: "share", name: "code_master" })
export class CodeMaster {
  @PrimaryColumn({ name: "id" })
  id: number;

  @Column("varchar", { name: "category" })
  category: string;

  @Column("varchar", { name: "key" })
  key: string;

  @Column("varchar", { name: "value" })
  value: string;

  @Column("smallint", { name: "delete_flg" })
  deleteFlg: number;
}
