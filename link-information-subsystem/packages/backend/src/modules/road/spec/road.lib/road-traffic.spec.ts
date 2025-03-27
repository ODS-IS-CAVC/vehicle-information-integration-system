import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HdLaneCenterLine } from "src/entities/viewer/hd-lane-center-line.entity";
import { HdSdRoadLink } from "src/entities/viewer/hd-sd-road-link.entity";
import { SdRoadName } from "src/entities/sdmap/road-name.entity";
import { SchemaRelation } from "src/entities/version/schema-relation.entity";
import { DataSource, SelectQueryBuilder } from "typeorm";
import { RoadName } from "../../lib/common/road-name";
import { FinalHimozukeSet } from "src/entities/traffic/final_himozuke_set.entity";
import { RoadTraffic } from "../../lib/road-traffic";
import { TrafficLink } from "src/entities/traffic/traffic-link.entity";

const expectedValue = [
  {
    timestamp: new Date("2023-11-25T04:00:00.000Z"),
    routeName: "新東名",
    directionName: "下り",
    cause: "除草作業",
    regulation: "片側交互通行",
    severity: 1,
    length: 560,
    downstreamLat: 35.0432238978153,
    downstreamLon: 137.20132885980547,
    downstreamHi: -1,
    downstreamDistance: 83507.16948094965,
    upstreamLat: 35.323198053934,
    upstreamLon: 138.9170649634395,
    upstreamHi: -1,
    upstreamDistance: 84174.99703273781,
    downstreamKp: 20579,
    upstreamKP: 0,
    laneCategory: "junction",
    plannedEndTimestamp: new Date("2024-07-14T03:00:00.000Z"),
    causeVehicleName1: "トラック",
    causeVehicleNumber1: 2,
    causeVehicleName2: null,
    causeVehicleNumber2: null,
    causeVehicleName3: null,
    causeVehicleNumber3: null,
    handlingStatus: "handling",
    prediction: "extend",
    plannedResumeTimestamp: new Date("2024-06-24T06:00:00.000Z"),
  },
  {
    timestamp: new Date("2023-12-25T05:25:00.000Z"),
    routeName: "新東名",
    directionName: "下り",
    cause: "歩行者天国",
    regulation: "通行止",
    severity: 1,
    length: 519,
    downstreamLat: 35.0432238978153,
    downstreamLon: 137.20132885980547,
    downstreamHi: -1,
    downstreamDistance: 90716.12621897341,
    upstreamLat: 35.323198053934,
    upstreamLon: 138.9170649634395,
    upstreamHi: -1,
    upstreamDistance: 114564.00131038655,
    downstreamKp: 20579,
    upstreamKP: 0,
    laneCategory: "main",
    plannedEndTimestamp: new Date("2024-08-14T03:00:00.000Z"),
    causeVehicleName1: "普通車",
    causeVehicleNumber1: 1,
    causeVehicleName2: "大型",
    causeVehicleNumber2: 4,
    causeVehicleName3: "自動二輪",
    causeVehicleNumber3: null,
    handlingStatus: "other",
    prediction: "nochange",
    plannedResumeTimestamp: new Date("2024-07-24T03:45:00.000Z"),
  },
  {
    timestamp: new Date("2024-01-23T19:55:00.000Z"),
    routeName: "新東名",
    directionName: "上り",
    cause: "流出物",
    regulation: "入口閉鎖",
    severity: 2,
    length: 17089,
    downstreamLat: 35.32345362207969,
    downstreamLon: 138.91692717003045,
    downstreamHi: -1,
    downstreamDistance: 143057.30415971176,
    upstreamLat: 35.043315181916725,
    upstreamLon: 137.20174937704684,
    upstreamHi: -1,
    upstreamDistance: 41481.13138367541,
    downstreamKp: 20602,
    upstreamKP: 0,
    laneCategory: "entry",
    plannedEndTimestamp: new Date("2024-01-25T07:45:00.000Z"),
    causeVehicleName1: "軽自動車",
    causeVehicleNumber1: 3,
    causeVehicleName2: "特殊車両",
    causeVehicleNumber2: 4,
    causeVehicleName3: "大型2t",
    causeVehicleNumber3: 1,
    handlingStatus: "deregulating",
    prediction: "shrink",
    plannedResumeTimestamp: new Date("2024-01-25T18:56:00.000Z"),
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

describe("RoadTraffic", () => {
  let roadTraffic: RoadTraffic;
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
        TypeOrmModule.forFeature([SchemaRelation, HdLaneCenterLine, HdSdRoadLink, FinalHimozukeSet, TrafficLink, SdRoadName]),
      ],
      providers: [RoadTraffic],
    }).compile();

    await module.init();
    roadTraffic = module.get<RoadTraffic>(RoadTraffic);
    dataSource = module.get<DataSource>(DataSource);
    query = dataSource.createQueryBuilder();
    spyAddFilterRoadNameQuery = jest.spyOn(RoadName, "addFilterRoadNameQuery");
  });

  afterEach(async () => {
    await module.close();
  });

  it("should be defined", () => {
    expect(roadTraffic).toBeDefined();
  });

  it("道路名が未指定で、roadSegmentId=13096を指定した場合に、当該データが取得できること。", async () => {
    roadTraffic.createPropertiesQuery(query, {}, mockSchemaRelation);

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
      roadTraffic.createPropertiesQuery(query, { roadName: "新東名" }, mockSchemaRelation);
      expect(spyAddFilterRoadNameQuery).toHaveBeenCalledWith(query, "新東名");
    });

    it("道路名『新東名』・roadSegmentId=13096を指定した場合に、当該データが取得できること", async () => {
      roadTraffic.createPropertiesQuery(query, { roadName: "新東名" }, mockSchemaRelation);

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
});
