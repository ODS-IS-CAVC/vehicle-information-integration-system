import { Test, TestingModule } from "@nestjs/testing";
import { RoadHdSign } from "../../lib/road-hd-signs";
import { DataSource, SelectQueryBuilder } from "typeorm";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HdSdRelation } from "src/entities/himozuke/hd-sd-relation.entity";
import { HdSdRoadLink } from "src/entities/viewer/hd-sd-road-link.entity";
import { HdSignMapping } from "src/entities/ushr-format/hd-sign-mapping.entity";
import { HdSign } from "src/entities/ushr-format/hd-sign.entity";
import { SdRoadName } from "src/entities/sdmap/road-name.entity";
import { SchemaRelation } from "src/entities/version/schema-relation.entity";

describe("RoadHdSign", () => {
  let roadHdSign: RoadHdSign;
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
        TypeOrmModule.forFeature([HdSdRelation, HdSdRoadLink, HdSignMapping, HdSign, SdRoadName, SchemaRelation]),
      ],
      providers: [RoadHdSign],
    }).compile();

    await module.init();
    roadHdSign = module.get<RoadHdSign>(RoadHdSign);
    dataSource = module.get<DataSource>(DataSource);
    query = dataSource.createQueryBuilder();
  });

  afterEach(async () => {
    await module.close();
  });

  it("should be defined", () => {
    expect(roadHdSign).toBeDefined();
  });

  it("道路名が未指定で、id=60449,204729を指定した場合に、当該データが取得できること", async () => {
    roadHdSign.createPropertiesQuery(query, {}, mockSchemaRelation);

    // 期待値
    const expectedValue = [
      // SDマップと紐づけなしの場合
      {
        id: 60449,
        roadSegmentIds: [19314],
        classCodes: [],
        nameCodes: [],
        type: 57,
        shape: 0,
      },
      // SDマップと紐づけありの場合
      {
        id: 204729,
        roadSegmentIds: [11481, 21221],
        classCodes: ["_101_"],
        nameCodes: [0, 201130],
        type: 9,
        shape: 0,
      },
    ];

    // アサーションの呼び出し確認
    expect.assertions(2);
    // 実行して結果を比較
    query.andWhere("tg.id = 60449").orWhere("tg.id= 204729").addOrderBy("tg.sign_id");
    const rows = await query.getRawMany();
    for (const [index, row] of rows.entries()) {
      expect(row).toEqual(expectedValue[index]);
    }
  });

  describe("道路名検索(roadName)による絞り込み", () => {
    it("道路名『新東名高速』を指定した場合に、当該データが取得できること", async () => {
      roadHdSign.createPropertiesQuery(query, { roadName: "新東名高速" }, mockSchemaRelation);

      // 期待値（1つ目、2つ目）
      const expectedValue = [
        {
          id: 171081,
          roadSegmentIds: [15328],
          classCodes: ["_101_"],
          nameCodes: [201130],
          type: 9,
          shape: 0,
        },
        {
          id: 171928,
          roadSegmentIds: [11762],
          classCodes: ["_101_"],
          nameCodes: [201130],
          type: 9,
          shape: 0,
        },
      ];

      // アサーションの呼び出し確認
      expect.assertions(2);
      // 実行して結果を比較
      query.addOrderBy("tg.sign_id");
      const rows = await query.getRawMany();
      for (let index = 0; index <= 1; index++) {
        expect(rows[index]).toEqual(expectedValue[index]);
      }
    });
  });
});
