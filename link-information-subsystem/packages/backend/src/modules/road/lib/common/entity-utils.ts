import { SchemaRelation } from "src/entities/version/schema-relation.entity";
import { SelectQueryBuilder } from "typeorm";

export function updateSchemaForEntities(query: SelectQueryBuilder<any>, entityNames: string[], schemaRelation: SchemaRelation) {
  query.connection.entityMetadatas
    .filter((metaData) => entityNames.includes(metaData.name))
    .forEach((entityMetadata) => {
      // NOTE: entityMetadata.schemaを1度上書きしてしまうと永続してしまうのでentityMetadata.tableMetadataArgs.schemaを初期値として利用しています。
      if (entityMetadata.tableMetadataArgs.schema === "viewer") {
        entityMetadata.schema = `${entityMetadata.tableMetadataArgs.schema}_${schemaRelation.viewerVersion}`;
      } else if (entityMetadata.tableMetadataArgs.schema === "ushr_format") {
        entityMetadata.schema = `${entityMetadata.tableMetadataArgs.schema}_${schemaRelation.hdmapVersion}`;
      } else if (entityMetadata.tableMetadataArgs.schema === "sdmap") {
        entityMetadata.schema = `${entityMetadata.tableMetadataArgs.schema}_${schemaRelation.sdmapVersion}`;
      } else if (entityMetadata.tableMetadataArgs.schema === "himozuke") {
        entityMetadata.schema = `${entityMetadata.tableMetadataArgs.schema}_${schemaRelation.himozukeVersion}`;
      }

      entityMetadata.tablePath = `${entityMetadata.schema}.${entityMetadata.tableName}`;
    });
}
