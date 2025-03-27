import { Test, TestingModule } from "@nestjs/testing";
import { RoadHdLaneLine } from "../../lib/road-hd-lane-line";
import { DataSource, SelectQueryBuilder } from "typeorm";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HdLaneLine } from "src/entities/viewer/hd-lane-line.entity";
import { HdLane } from "src/entities/ushr-format/hd-lane.entity";
import { HdSdRoadLink } from "src/entities/viewer/hd-sd-road-link.entity";
import { SdRoadName } from "src/entities/sdmap/road-name.entity";
import { SchemaRelation } from "src/entities/version/schema-relation.entity";
import { RoadName } from "../../lib/common/road-name";

describe("RoadHdLaneLine", () => {
  let roadHdLaneLine: RoadHdLaneLine;
  let module: TestingModule;
  let dataSource: DataSource;
  let query: SelectQueryBuilder<any>;
  let spyAddFilterRoadNameQuery: jest.SpyInstance;

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
        TypeOrmModule.forFeature([HdLaneLine, HdLane, HdSdRoadLink, SdRoadName, SchemaRelation]),
      ],
      providers: [RoadHdLaneLine],
    }).compile();

    await module.init();
    roadHdLaneLine = module.get<RoadHdLaneLine>(RoadHdLaneLine);
    dataSource = module.get<DataSource>(DataSource);
    query = dataSource.createQueryBuilder();

    spyAddFilterRoadNameQuery = jest.spyOn(RoadName, "addFilterRoadNameQuery");
  });

  afterEach(async () => {
    await module.close();
  });

  it("should be defined", () => {
    expect(roadHdLaneLine).toBeDefined();
  });

  it("道路名が未指定で、roadSegmentId=5758を指定した場合に、当該データが取得できること", async () => {
    roadHdLaneLine.createPropertiesQuery(query, {}, mockSchemaRelation);

    // 期待値（1つ目、2つ目）
    const expectedValue = [
      {
        roadSegmentId: 5758,
        ordinalId: 1,
        minSeq: 0,
        maxSeq: 34,
        linkId: 3085600,
        direction: 1,
        width: 1,
        color: 1,
        type: 1,
        classCode: 1,
        nameCode: 0,
      },
      {
        roadSegmentId: 5758,
        ordinalId: 1,
        minSeq: 35,
        maxSeq: 56,
        linkId: 3085611,
        direction: 1,
        width: 1,
        color: 1,
        type: 1,
        classCode: 1,
        nameCode: 0,
      },
    ];

    // アサーションの呼び出し確認
    expect.assertions(2);
    // 実行して結果を比較
    query.andWhere("tg.roadSegmentId = 5758").addOrderBy("tg.ordinalId").addOrderBy("tg.minSequence");
    const rows = await query.getRawMany();
    for (let index = 0; index <= 1; index++) {
      expect(rows[index]).toEqual(expectedValue[index]);
    }
  });

  describe("道路名検索(roadName)による絞り込み", () => {
    it("道路名『島田金谷バイパス』を指定した場合に、RoadName.addFilterRoadNameQueryが呼ばれること", () => {
      // RoadName.addFilterRoadNameQueryが呼ばれることの確認
      roadHdLaneLine.createPropertiesQuery(query, { roadName: "島田金谷バイパス" }, mockSchemaRelation);
      expect(spyAddFilterRoadNameQuery).toHaveBeenCalledWith(query, "島田金谷バイパス");
    });

    it("道路名『島田金谷バイパス』を指定した場合に、当該データが取得できること", async () => {
      roadHdLaneLine.createPropertiesQuery(query, { roadName: "島田金谷バイパス" }, mockSchemaRelation);

      // 期待値（1つ目、2つ目）
      const expectedValue = [
        {
          roadSegmentId: 6238,
          ordinalId: 1,
          minSeq: 0,
          maxSeq: 117,
          linkId: 6676212,
          direction: 1,
          width: 1,
          color: 1,
          type: 1,
          classCode: 1,
          nameCode: 166974,
        },
        {
          roadSegmentId: 6238,
          ordinalId: 2,
          minSeq: 0,
          maxSeq: 117,
          linkId: 6676212,
          direction: 1,
          width: 1,
          color: 2,
          type: 1,
          classCode: 1,
          nameCode: 166974,
        },
      ];

      // アサーションの呼び出し確認
      expect.assertions(2);
      // 実行して結果を比較
      query.addOrderBy("tg.roadSegmentId").addOrderBy("tg.ordinalId").addOrderBy("tg.minSequence");
      const rows = await query.getRawMany();
      for (let index = 0; index <= 1; index++) {
        expect(rows[index]).toEqual(expectedValue[index]);
      }
    });
  });
});
