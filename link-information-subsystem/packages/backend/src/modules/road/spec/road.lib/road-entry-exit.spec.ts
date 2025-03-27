import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HdLaneCenterLine } from "src/entities/viewer/hd-lane-center-line.entity";
import { HdSdRoadLink } from "src/entities/viewer/hd-sd-road-link.entity";
import { SdRoadName } from "src/entities/sdmap/road-name.entity";
import { SchemaRelation } from "src/entities/version/schema-relation.entity";
import { DataSource, SelectQueryBuilder } from "typeorm";
import { RoadEntryExit } from "src/modules/road/lib/road-entry-exit";
import { RoadName } from "../../lib/common/road-name";
import { FinalHimozukeSet } from "src/entities/traffic/final_himozuke_set.entity";
import { EntryExit } from "src/entities/traffic/entry-exit.entity";

const expectedValue = [
  {
    roadSegmentId: 24397,
    laneNumber: 1,
    minSeq: 0,
    maxSeq: 492,
    timestamp: new Date("2024-11-27T19:56:00.000Z"),
    latitude: 35.2016014885664,
    longitude: 138.65390100362728,
    height: -1,
    routeName: "新東名",
    directionName: "下り",
    name: "新富士ＩＣ",
    isEntrance: 2,
    linkId: 22673070,
    direction: 1,
    classCode: 101,
    nameCode: 201130,
  },
  {
    roadSegmentId: 24397,
    laneNumber: 2,
    minSeq: 0,
    maxSeq: 492,
    timestamp: new Date("2024-11-27T19:56:00.000Z"),
    latitude: 35.2016014885664,
    longitude: 138.65390100362728,
    height: -1,
    routeName: "新東名",
    directionName: "下り",
    name: "新富士ＩＣ",
    isEntrance: 2,
    linkId: 22673070,
    direction: 1,
    classCode: 101,
    nameCode: 201130,
  },
  {
    roadSegmentId: 24397,
    laneNumber: 3,
    minSeq: 0,
    maxSeq: 492,
    timestamp: new Date("2024-11-27T19:56:00.000Z"),
    latitude: 35.2016014885664,
    longitude: 138.65390100362728,
    height: -1,
    routeName: "新東名",
    directionName: "下り",
    name: "新富士ＩＣ",
    isEntrance: 2,
    linkId: 22673070,
    direction: 1,
    classCode: 101,
    nameCode: 201130,
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

describe("RoadEntryExit", () => {
  let roadEntryExit: RoadEntryExit;
  let module: TestingModule;
  let dataSource: DataSource;
  let query: SelectQueryBuilder<any>;
  let spyAddFilterRoadNameQuery: jest.SpyInstance;

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
        TypeOrmModule.forFeature([SchemaRelation, HdLaneCenterLine, HdSdRoadLink, FinalHimozukeSet, EntryExit, SdRoadName]),
      ],
      providers: [RoadEntryExit],
    }).compile();

    await module.init();
    roadEntryExit = module.get<RoadEntryExit>(RoadEntryExit);
    dataSource = module.get<DataSource>(DataSource);
    query = dataSource.createQueryBuilder();
    spyAddFilterRoadNameQuery = jest.spyOn(RoadName, "addFilterRoadNameQuery");
  });

  afterEach(async () => {
    await module.close();
  });

  it("should be defined", () => {
    expect(roadEntryExit).toBeDefined();
  });

  it("道路名が未指定で、roadSegmentId=24397を指定した場合に、当該データが取得できること。", async () => {
    roadEntryExit.createPropertiesQuery(query, {}, mockSchemaRelation);

    // アサーションの呼び出し確認
    expect.assertions(3);
    // 実行して結果を比較
    query.andWhere("tg.roadSegmentId = 24397").addOrderBy("tg.laneNumber").addOrderBy("tg.minSequence");
    const rows = await query.getRawMany();
    for (let index = 0; index <= 2; index++) {
      expect(rows[index]).toEqual(expectedValue[index]);
    }
  });

  describe("道路名検索(roadName)による絞り込み", () => {
    it("道路名『新東名』を指定した場合に、RoadName.addFilterRoadNameQueryが呼ばれること。", () => {
      // RoadName.addFilterRoadNameQueryが呼ばれることの確認
      roadEntryExit.createPropertiesQuery(query, { roadName: "新東名" }, mockSchemaRelation);
      expect(spyAddFilterRoadNameQuery).toHaveBeenCalledWith(query, "新東名");
    });

    it("道路名『新東名』・roadSegmentId=24397を指定した場合に、当該データが取得できること", async () => {
      roadEntryExit.createPropertiesQuery(query, { roadName: "新東名" }, mockSchemaRelation);

      // アサーションの呼び出し確認
      expect.assertions(3);
      // 実行して結果を比較
      query.andWhere("tg.roadSegmentId = 24397").addOrderBy("tg.laneNumber").addOrderBy("tg.minSequence");
      const rows = await query.getRawMany();
      for (let index = 0; index <= 2; index++) {
        expect(rows[index]).toEqual(expectedValue[index]);
      }
    });
  });
});
