import { Test, TestingModule } from "@nestjs/testing";
import { RoadHdIntersection } from "../../lib/road-hd-intersection";
import { DataSource, SelectQueryBuilder } from "typeorm";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HdSdRoadLink } from "src/entities/viewer/hd-sd-road-link.entity";
import { HdIntersectionMapping } from "src/entities/ushr-format/hd-intersection-mapping.entity";
import { HdIntersection } from "src/entities/ushr-format/hd-intersection.entity";
import { HdLaneCenterLine } from "src/entities/viewer/hd-lane-center-line.entity";
import { SdRoadName } from "src/entities/sdmap/road-name.entity";
import { SchemaRelation } from "src/entities/version/schema-relation.entity";

describe("RoadHdIntersection", () => {
  let roadHdIntersection: RoadHdIntersection;
  let module: TestingModule;
  let dataSource: DataSource;
  let query: SelectQueryBuilder<any>;

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
        TypeOrmModule.forFeature([HdSdRoadLink, HdIntersectionMapping, HdIntersection, HdLaneCenterLine, SdRoadName, SchemaRelation]),
      ],
      providers: [RoadHdIntersection],
    }).compile();

    await module.init();
    roadHdIntersection = module.get<RoadHdIntersection>(RoadHdIntersection);
    dataSource = module.get<DataSource>(DataSource);
    query = dataSource.createQueryBuilder();
  });

  afterEach(async () => {
    await module.close();
  });

  it("should be defined", () => {
    expect(roadHdIntersection).toBeDefined();
  });

  it("道路名が未指定で、id=37, 496を指定した場合に、当該データが取得できること", async () => {
    roadHdIntersection.createPropertiesQuery(query, {}, mockSchemaRelation);

    // 期待値
    const expectedValue = [
      {
        id: 37,
        roadSegmentIds: [8812, 10102, 13838],
        classCodes: ["_1_", "_101_"],
        nameCodes: [0],
      },
      {
        id: 496,
        roadSegmentIds: [22702],
        classCodes: ["_1_"],
        nameCodes: [0],
      },
    ];

    // アサーションの呼び出し確認
    expect.assertions(2);
    // 実行して結果を比較
    query.where("tg.id = 37").orWhere("tg.id= 496").addOrderBy("tg.intersection_id");
    const rows = await query.getRawMany();
    for (const [index, row] of rows.entries()) {
      expect(row).toEqual(expectedValue[index]);
    }
  });

  describe("道路名検索(roadName)による絞り込み", () => {
    it("道路名『東名高速』を指定した場合に、当該データが取得できること", async () => {
      roadHdIntersection.createPropertiesQuery(query, { roadName: "東名高速" }, mockSchemaRelation);

      // 期待値
      const expectedValue = [
        {
          id: 49,
          roadSegmentIds: [26762],
          classCodes: ["_101_"],
          nameCodes: [201120],
        },
      ];

      // アサーションの呼び出し確認
      expect.assertions(1);
      // 実行して結果を比較
      query.addOrderBy("tg.intersection_id");
      const rows = await query.getRawMany();
      expect(rows).toEqual(expectedValue);
    });
  });
});
