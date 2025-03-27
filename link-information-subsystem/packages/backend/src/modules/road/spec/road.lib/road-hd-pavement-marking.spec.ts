import { Test, TestingModule } from "@nestjs/testing";
import { RoadHdPavementMarking } from "../../lib/road-hd-pavement-marking";
import { DataSource, SelectQueryBuilder } from "typeorm";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HdSdRelation } from "src/entities/himozuke/hd-sd-relation.entity";
import { HdSdRoadLink } from "src/entities/viewer/hd-sd-road-link.entity";
import { HdPavementMarking } from "src/entities/ushr-format/hd-pavement-marking.entity";
import { HdPavementMarkingMapping } from "src/entities/ushr-format/hd-pavement-marking-mapping.entity";
import { SdRoadName } from "src/entities/sdmap/road-name.entity";
import { SchemaRelation } from "src/entities/version/schema-relation.entity";

describe("RoadHdPavementMarking", () => {
  let roadHdPavementMarking: RoadHdPavementMarking;
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
        TypeOrmModule.forFeature([HdSdRelation, HdSdRoadLink, HdPavementMarking, HdPavementMarkingMapping, SdRoadName, SchemaRelation]),
      ],
      providers: [RoadHdPavementMarking],
    }).compile();

    await module.init();
    roadHdPavementMarking = module.get<RoadHdPavementMarking>(RoadHdPavementMarking);
    dataSource = module.get<DataSource>(DataSource);
    query = dataSource.createQueryBuilder();
  });

  afterEach(async () => {
    await module.close();
  });

  it("should be defined", () => {
    expect(roadHdPavementMarking).toBeDefined();
  });

  it("道路名が未指定で、id=105044,509109を指定した場合に、当該データが取得できること", async () => {
    roadHdPavementMarking.createPropertiesQuery(query, {}, mockSchemaRelation);

    // 期待値
    const expectedValue = [
      {
        id: 105044,
        roadSegmentIds: [27541],
        classCodes: ["_101_"],
        nameCodes: [0],
        type: 10,
      },
      {
        id: 509109,
        roadSegmentIds: [24477],
        classCodes: ["_101_"],
        nameCodes: [0],
        type: 17,
      },
    ];

    // アサーションの呼び出し確認
    expect.assertions(2);
    // 実行して結果を比較
    query.andWhere("tg.id = 105044").orWhere("tg.id= 509109").addOrderBy("tg.pavement_marking_id");
    const rows = await query.getRawMany();
    for (const [index, row] of rows.entries()) {
      expect(row).toEqual(expectedValue[index]);
    }
  });

  describe("道路名検索(roadName)による絞り込み", () => {
    it("道路名『新東名高速』を指定した場合に、当該データが取得できること", async () => {
      roadHdPavementMarking.createPropertiesQuery(query, { roadName: "新東名高速" }, mockSchemaRelation);

      // 期待値（1つ目、2つ目）
      const expectedValue = [
        {
          id: 266692,
          roadSegmentIds: [20125],
          classCodes: ["_101_"],
          nameCodes: [201130],
          type: 17,
        },
        {
          id: 266693,
          roadSegmentIds: [20125],
          classCodes: ["_101_"],
          nameCodes: [201130],
          type: 17,
        },
      ];

      // アサーションの呼び出し確認
      expect.assertions(2);
      // 実行して結果を比較
      query.addOrderBy("tg.pavement_marking_id");
      const rows = await query.getRawMany();
      for (let index = 0; index <= 1; index++) {
        expect(rows[index]).toEqual(expectedValue[index]);
      }
    });
  });
});
