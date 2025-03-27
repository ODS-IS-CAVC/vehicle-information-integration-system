import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import dayjs from "dayjs";
import { SchemaRelation } from "src/entities/version/schema-relation.entity";
import { Repository } from "typeorm";

@Injectable()
export class SchemaRelationService {
  constructor(
    @InjectRepository(SchemaRelation)
    private readonly schemaRelationRepository: Repository<SchemaRelation>,
  ) {}

  /**
   * スキーマリレーションの取得
   * @param {string} [timestamp] - 取得したいスキーマリレーションの基準となるタイムスタンプ（オプション）。
   * @returns {Promise<SchemaRelation>} 対象のスキーマリレーションを返します。
   */
  async getSchemaRelation(timestamp?: string): Promise<SchemaRelation> {
    if (timestamp) {
      // 指定されたタイムスタンプがある場合は、そのタイムスタンプに最も近い作成日時のスキーマリレーションを取得
      const parsedTimestamp = dayjs(timestamp).toDate();
      const result = await this.schemaRelationRepository
        .createQueryBuilder("schema_relations")
        .orderBy("ABS(EXTRACT(EPOCH FROM (age(schema_relations.createdAt, :timestamp))))", "ASC")
        .setParameter("timestamp", parsedTimestamp)
        .getOne();

      return result;
    } else {
      // 指定されていない場合は、最新のスキーマリレーションを取得
      const result = await this.schemaRelationRepository
        .createQueryBuilder("schema_relations")
        .orderBy("schema_relations.createdAt", "DESC")
        .getOne();

      return result;
    }
  }
}
