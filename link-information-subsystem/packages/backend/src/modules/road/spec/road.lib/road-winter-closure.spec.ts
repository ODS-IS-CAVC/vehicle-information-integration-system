import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HdLaneCenterLine } from "src/entities/viewer/hd-lane-center-line.entity";
import { HdSdRoadLink } from "src/entities/viewer/hd-sd-road-link.entity";
import { SdRoadName } from "src/entities/sdmap/road-name.entity";
import { SchemaRelation } from "src/entities/version/schema-relation.entity";
import { DataSource, SelectQueryBuilder } from "typeorm";
import { RoadName } from "../../lib/common/road-name";
import { FinalHimozukeSet } from "src/entities/traffic/final_himozuke_set.entity";
import { RoadWinterClosure } from "../../lib/road-winter-closure";
import { WinterClosure } from "src/entities/traffic/winter-closure.entity";

const expectedValue = [
  {
    timestamp: new Date("2024-05-16T18:42:00.000Z"),
    routeName: "新東名",
    directionName: "下り",
    cause: "凍結",
    regulation: "通行止",
    downstreamLat: 35.0432238978153,
    downstreamLon: 137.20132885980547,
    downstreamHi: -1,
    downstreamDistance: 163773.80436579423,
    upstreamLat: 35.323198053934,
    upstreamLon: 138.9170649634395,
    upstreamHi: -1,
    upstreamDistance: 41515.68181299714,
    laneCategory: "main",
    plannedStartTimestamp: new Date("2022-11-02T05:23:00.000Z"),
    plannedEndTimestamp: new Date("2022-11-04T20:47:00.000Z"),
    endTimestamp: new Date("2022-11-05T03:00:00.000Z"),
    detour1: "迂回路1",
    detour2: null,
    isCurrentStatus: 0,
  },
  {
    timestamp: new Date("2024-10-07T22:55:00.000Z"),
    routeName: "新東名",
    directionName: "上り",
    cause: "積雪",
    regulation: "通行止",
    downstreamLat: 35.043315181916725,
    downstreamLon: 137.20174937704684,
    downstreamHi: -1,
    downstreamDistance: 95037.10985298852,
    upstreamLat: 35.32345362207969,
    upstreamLon: 138.91692717003045,
    upstreamHi: -1,
    upstreamDistance: 107154.61283216836,
    laneCategory: "junction",
    plannedStartTimestamp: new Date("2023-11-30T18:15:00.000Z"),
    plannedEndTimestamp: new Date("2024-11-24T16:00:00.000Z"),
    endTimestamp: new Date("2024-10-08T03:00:00.000Z"),
    detour1: null,
    detour2: "迂回路2",
    isCurrentStatus: 1,
  },
  {
    timestamp: new Date("2024-10-10T14:56:00.000Z"),
    routeName: "新東名",
    directionName: "下り",
    cause: "積雪",
    regulation: "通行止",
    downstreamLat: 35.0432238978153,
    downstreamLon: 137.20132885980547,
    downstreamHi: -1,
    downstreamDistance: 120914.26959530603,
    upstreamLat: 35.323198053934,
    upstreamLon: 138.9170649634395,
    upstreamHi: -1,
    upstreamDistance: 84685.8802780777,
    laneCategory: "entry",
    plannedStartTimestamp: new Date("2023-12-24T20:36:00.000Z"),
    plannedEndTimestamp: new Date("2024-11-29T04:00:00.000Z"),
    endTimestamp: new Date("2024-10-25T14:50:00.000Z"),
    detour1: "迂回路1",
    detour2: "迂回路2",
    isCurrentStatus: 1,
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

describe("RoadWinterClosure", () => {
  let roadWinterClosure: RoadWinterClosure;
  let module: TestingModule;
  let dataSource: DataSource;
  let query: SelectQueryBuilder<any>;
  let spyAddFilterRoadNameQuery: jest.SpyInstance;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: "postgres",
          host: "10.71.80.38",
          port: 15432,
          username: "postgres",
          password: "postgres",
          database: "DMDB",
          autoLoadEntities: true,
        }),
        TypeOrmModule.forFeature([SchemaRelation, HdLaneCenterLine, HdSdRoadLink, FinalHimozukeSet, WinterClosure, SdRoadName]),
      ],
      providers: [RoadWinterClosure],
    }).compile();

    await module.init();
    roadWinterClosure = module.get<RoadWinterClosure>(RoadWinterClosure);
    dataSource = module.get<DataSource>(DataSource);
    query = dataSource.createQueryBuilder();
    spyAddFilterRoadNameQuery = jest.spyOn(RoadName, "addFilterRoadNameQuery");
  });

  afterEach(async () => {
    await module.close();
  });

  it("should be defined", () => {
    expect(roadWinterClosure).toBeDefined();
  });

  it("道路名が未指定で、roadSegmentId=6130を指定した場合に、当該データが取得できること。", async () => {
    roadWinterClosure.createPropertiesQuery(query, {}, mockSchemaRelation);

    // アサーションの呼び出し確認
    expect.assertions(6);
    // 実行して結果を比較
    const rows = await query.getRawMany();
    for (let index = 0; index <= 2; index++) {
      const { roadInfo, ...other } = rows[index];
      expect(other).toEqual(expectedValue[index]);
      expect(roadInfo.length).not.toBe(0);
    }
  });

  describe("道路名検索(roadName)による絞り込み", () => {
    it("道路名『新東名』を指定した場合に、RoadName.addFilterRoadNameQueryが呼ばれること。", () => {
      // RoadName.addFilterRoadNameQueryが呼ばれることの確認
      roadWinterClosure.createPropertiesQuery(query, { roadName: "新東名" }, mockSchemaRelation);
      expect(spyAddFilterRoadNameQuery).toHaveBeenCalledWith(query, "新東名");
    });

    it("道路名『新東名』・roadSegmentId=6130を指定した場合に、当該データが取得できること", async () => {
      roadWinterClosure.createPropertiesQuery(query, { roadName: "新東名" }, mockSchemaRelation);

      // アサーションの呼び出し確認
      expect.assertions(6);
      // 実行して結果を比較
      const rows = await query.getRawMany();
      for (let index = 0; index <= 2; index++) {
        const { roadInfo, ...other } = rows[index];
        expect(other).toEqual(expectedValue[index]);
        expect(roadInfo.length).not.toBe(0);
      }
    });
  });

  describe("タイムスタンプ(timestamp)による絞り込み", () => {
    it("タイムスタンプ・roadSegmentId=6130を指定した場合に、当該データが取得できること", async () => {
      roadWinterClosure.createPropertiesQuery(query, { timestamp: "2022-11-03T00:00:00.000Z" }, mockSchemaRelation);

      // アサーションの呼び出し確認
      expect.assertions(2);
      // 実行して結果を比較
      const rows = await query.getRawMany();
      const { roadInfo, ...other } = rows[0];
      expect(other).toEqual(expectedValue[0]);
      expect(roadInfo.length).not.toBe(0);
    });
  });

  describe("検索対象期間(startTimestamp/endTimestamp)による絞り込み", () => {
    it("検索対象期間・roadSegmentId=6130を指定した場合に、当該データが取得できること", async () => {
      roadWinterClosure.createPropertiesQuery(
        query,
        { startTimestamp: "2022-11-02T05:23:00.000Z", endTimestamp: "2022-11-04T20:47:00.000Z" },
        mockSchemaRelation,
      );

      // アサーションの呼び出し確認
      expect.assertions(2);
      // 実行して結果を比較
      const rows = await query.getRawMany();
      const { roadInfo, ...other } = rows[0];
      expect(other).toEqual(expectedValue[0]);
      expect(roadInfo.length).not.toBe(0);
    });
  });
});
