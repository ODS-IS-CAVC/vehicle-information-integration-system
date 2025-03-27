import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HdLaneCenterLine } from "src/entities/viewer/hd-lane-center-line.entity";
import { HdSdRoadLink } from "src/entities/viewer/hd-sd-road-link.entity";
import { SdRoadName } from "src/entities/sdmap/road-name.entity";
import { SchemaRelation } from "src/entities/version/schema-relation.entity";
import { DataSource, SelectQueryBuilder } from "typeorm";
import { RoadName } from "../../lib/common/road-name";
import { FinalHimozukeSet } from "src/entities/traffic/final_himozuke_set.entity";
import { RoadConstructionEvent } from "../../lib/road-construction-event";
import { ConstructionEvent } from "src/entities/traffic/construction-event.entity";

const expectedValue = [
  {
    timestamp: new Date("2024-05-16T17:10:00.000Z"),
    routeName: "新東名",
    directionName: "上り",
    cause: "人工雪崩作業",
    regulation: "雪用タイヤ着",
    downstreamKP: 20602,
    downstreamLat: 35.043315181916725,
    downstreamLon: 137.20174937704684,
    downstreamHi: -1,
    downstreamDistance: 81793.65726984144,
    upstreamKP: 0,
    upstreamLat: 35.32345362207969,
    upstreamLon: 138.91692717003045,
    upstreamHi: -1,
    upstreamDistance: 124088.9729783953,
    laneCategory: "main",
    plannedStartTimestamp: new Date("2024-10-06T03:00:00.000Z"),
    plannedEndTimestamp: new Date("2024-10-08T03:00:00.000Z"),
    endTimestamp: new Date("2024-10-07T15:00:00.000Z"),
    detour1: null,
    detour2: null,
    isCurrentStatus: 1,
  },
  {
    timestamp: new Date("2024-08-26T16:45:00.000Z"),
    routeName: "新東名",
    directionName: "上り",
    cause: "トンネル工事",
    regulation: "右ルート閉鎖",
    downstreamKP: 20602,
    downstreamLat: 35.043315181916725,
    downstreamLon: 137.20174937704684,
    downstreamHi: -1,
    downstreamDistance: 81938.35675442679,
    upstreamKP: 0,
    upstreamLat: 35.32345362207969,
    upstreamLon: 138.91692717003045,
    upstreamHi: -1,
    upstreamDistance: 123271.39202769946,
    laneCategory: "entry",
    plannedStartTimestamp: new Date("2024-08-26T06:17:00.000Z"),
    plannedEndTimestamp: new Date("2024-08-28T17:15:00.000Z"),
    endTimestamp: new Date("2024-08-29T15:55:00.000Z"),
    detour1: "迂回路1",
    detour2: "迂回路2",
    isCurrentStatus: 0,
  },
  {
    timestamp: new Date("2024-09-01T08:00:00.000Z"),
    routeName: "新東名",
    directionName: "上り",
    cause: "鉄道工事",
    regulation: "マイカー禁止",
    downstreamKP: 20602,
    downstreamLat: 35.043315181916725,
    downstreamLon: 137.20174937704684,
    downstreamHi: -1,
    downstreamDistance: 82755.93770512262,
    upstreamKP: 0,
    upstreamLat: 35.32345362207969,
    upstreamLon: 138.91692717003045,
    upstreamHi: -1,
    upstreamDistance: 121685.24639407378,
    laneCategory: "exit",
    plannedStartTimestamp: new Date("2024-07-23T09:23:00.000Z"),
    plannedEndTimestamp: new Date("2024-09-18T06:08:00.000Z"),
    endTimestamp: new Date("2024-09-17T21:00:00.000Z"),
    detour1: null,
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

describe("RoadConstructionEvent", () => {
  let roadConstructionEvent: RoadConstructionEvent;
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
        TypeOrmModule.forFeature([SchemaRelation, HdLaneCenterLine, HdSdRoadLink, FinalHimozukeSet, ConstructionEvent, SdRoadName]),
      ],
      providers: [RoadConstructionEvent],
    }).compile();

    await module.init();
    roadConstructionEvent = module.get<RoadConstructionEvent>(RoadConstructionEvent);
    dataSource = module.get<DataSource>(DataSource);
    query = dataSource.createQueryBuilder();
    spyAddFilterRoadNameQuery = jest.spyOn(RoadName, "addFilterRoadNameQuery");
  });

  afterEach(async () => {
    await module.close();
  });

  it("should be defined", () => {
    expect(roadConstructionEvent).toBeDefined();
  });

  it("道路名が未指定で、roadSegmentId=20333を指定した場合に、当該データが取得できること。", async () => {
    roadConstructionEvent.createPropertiesQuery(query, {}, mockSchemaRelation);

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
      roadConstructionEvent.createPropertiesQuery(query, { roadName: "新東名" }, mockSchemaRelation);
      expect(spyAddFilterRoadNameQuery).toHaveBeenCalledWith(query, "新東名");
    });

    it("道路名『新東名』・roadSegmentId=20333を指定した場合に、当該データが取得できること", async () => {
      roadConstructionEvent.createPropertiesQuery(query, { roadName: "新東名" }, mockSchemaRelation);

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
    it("タイムスタンプ・roadSegmentId=20333を指定した場合に、当該データが取得できること", async () => {
      roadConstructionEvent.createPropertiesQuery(query, { timestamp: "2024-10-07T03:00:00.000Z" }, mockSchemaRelation);

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
    it("検索対象期間・roadSegmentId=20333を指定した場合に、当該データが取得できること", async () => {
      roadConstructionEvent.createPropertiesQuery(
        query,
        { startTimestamp: "2024-10-06T03:00:00.000Z", endTimestamp: "2024-10-08T03:00:00.000Z" },
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
