import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ schema: "share", name: "shared_resources" })
export class SharedResources {
  @PrimaryColumn("int", { name: "id" })
  id: number;

  @Column("varchar", { name: "data_model_type" })
  dataModelType: string;

  @Column("varchar", { name: "category" })
  category: string;

  @Column("varchar", { name: "key" })
  key: string;

  @Column("text", { name: "value" })
  value: string;

  @Column("timestamp", { name: "valid_from" })
  validFrom: Date;

  @Column("timestamp", { name: "valid_to" })
  validTo: Date;

  @Column("timestamp", { name: "created_at", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @Column("timestamp", { name: "updated_at", default: () => "CURRENT_TIMESTAMP" })
  updatedAt: Date;
}
