import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SchemaRelation } from "src/entities/version/schema-relation.entity";
import { DataSource, SelectQueryBuilder } from "typeorm";
import { MergedLink } from "src/entities/sdmap/merged-link.entity";
import { RoadSdLink } from "../../lib/road-sd-link";

const expectedValue = [
  {
    objectid: 1,
    fromNodeId: 12367784,
    toNodeId: 1970001,
    classCode: 4,
    nameCode: 0,
  },
];

// モックデータの設定（schemaRelation）
const mockSchemaRelation = {
  recordId: 3,
  viewerVersion: 20241031,
  hdmapVersion: 20240919,
  sdmapVersion: 20240823,
  himozukeVersion: 20241007,
  createdAt: new Date("2024-10-31T00:26:27.655Z"),
  updatedAt: new Date("2024-10-31T00:26:27.655Z"),
  hasId: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  softRemove: jest.fn(),
  recover: jest.fn(),
  reload: jest.fn(),
};

describe("RoadSdLink", () => {
  let roadSdLink: RoadSdLink;
  let module: TestingModule;
  let dataSource: DataSource;
  let query: SelectQueryBuilder<any>;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: "postgres",
          host: "database",
          port: 5432,
          username: "postgres",
          password: "postgres",
          database: "postgres",
          autoLoadEntities: true,
        }),
        TypeOrmModule.forFeature([SchemaRelation, MergedLink]),
      ],
      providers: [RoadSdLink],
    }).compile();

    await module.init();
    roadSdLink = module.get<RoadSdLink>(RoadSdLink);
    dataSource = module.get<DataSource>(DataSource);
    query = dataSource.createQueryBuilder();
  });

  afterEach(async () => {
    await module.close();
  });

  it("should be defined", () => {
    expect(roadSdLink).toBeDefined();
  });

  it("objectid=1を指定した場合に、当該データが取得できること。", async () => {
    roadSdLink.createPropertiesQuery(query, {}, mockSchemaRelation);

    // アサーションの呼び出し確認
    expect.assertions(1);
    // 実行して結果を比較
    query.andWhere("tg.objectid = 1");
    const rows = await query.getRawMany();
    expect(rows).toEqual(expectedValue);
  });
});
