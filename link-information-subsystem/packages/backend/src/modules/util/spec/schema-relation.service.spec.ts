import { Test, TestingModule } from "@nestjs/testing";
import { SchemaRelationService } from "../schema-relation.service";
import { Repository } from "typeorm";
import { SchemaRelation } from "src/entities/version/schema-relation.entity";
import { getRepositoryToken } from "@nestjs/typeorm";
import dayjs from "dayjs";

describe("SchemaRelationService", () => {
  let schemaRelationService: SchemaRelationService;
  let schemaRelationRepository: Repository<SchemaRelation>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchemaRelationService,
        {
          provide: getRepositoryToken(SchemaRelation),
          useClass: Repository,
        },
      ],
    }).compile();

    schemaRelationService = module.get<SchemaRelationService>(SchemaRelationService);
    schemaRelationRepository = module.get<Repository<SchemaRelation>>(getRepositoryToken(SchemaRelation));
  });

  it("should be defined", () => {
    expect(schemaRelationService).toBeDefined();
  });

  describe("getSchemaRelation", () => {
    // モックデータの設定
    const createDate = dayjs().toDate();
    const updateDate = dayjs().toDate();
    const schemaRelationSimulateData = {
      recordId: 1,
      viewerVersion: 20241010,
      hdmapVersion: 20241010,
      sdmapVersion: 20241010,
      himozukeVersion: 20241010,
      createdAt: createDate,
      updatedAt: updateDate,
    };

    it("timestampが『2024-01-23T11:22:33Z』の場合にその日時から最も近い作成日時のスキーマリレーションを返却する", async () => {
      // モックデータの設定
      schemaRelationRepository.createQueryBuilder = jest.fn().mockReturnValue({
        orderBy: jest.fn().mockReturnThis(),
        setParameter: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(schemaRelationSimulateData),
      });

      // アサーションの呼び出し確認
      expect.assertions(1);
      // 実行して結果を比較
      await expect(schemaRelationService.getSchemaRelation("2024-01-23T11:22:33Z")).resolves.toEqual(schemaRelationSimulateData);
    });

    it("timestampが『undefind』の場合に最新のスキーマリレーションを返却する", async () => {
      // モックデータの設定
      schemaRelationRepository.createQueryBuilder = jest.fn().mockReturnValue({
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(schemaRelationSimulateData),
      });

      // アサーションの呼び出し確認
      expect.assertions(1);
      // 実行して結果を比較
      await expect(schemaRelationService.getSchemaRelation(undefined)).resolves.toEqual(schemaRelationSimulateData);
    });
  });
});
