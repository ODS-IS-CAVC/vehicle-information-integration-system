import { SchemaRelation } from "src/entities/version/schema-relation.entity";
import { SelectQueryBuilder } from "typeorm";

export interface PBFLib {
  sourceId: string;
  createPropertiesQuery(query: SelectQueryBuilder<any>, condition: any, schemaRelation: SchemaRelation): SelectQueryBuilder<any>;
}
