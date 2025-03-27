import { Test, TestingModule } from "@nestjs/testing";
import { RoadHdLaneCenter } from "../../lib/road-hd-lane-center";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HdLaneCenterLine } from "src/entities/viewer/hd-lane-center-line.entity";
import { HdSdRoadLink } from "src/entities/viewer/hd-sd-road-link.entity";
import { SdRoadName } from "src/entities/sdmap/road-name.entity";
import { SchemaRelation } from "src/entities/version/schema-relation.entity";
import { DataSource, SelectQueryBuilder } from "typeorm";
import { RoadName } from "../../lib/common/road-name";
import { roadRegulationTypes } from "src/consts/map.const";

describe("RoadHdLaneCenter", () => {
  let roadHdLaneCenter: RoadHdLaneCenter;
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
        TypeOrmModule.forFeature([HdSdRoadLink, HdLaneCenterLine, SdRoadName, SchemaRelation]),
      ],
      providers: [RoadHdLaneCenter],
    }).compile();

    await module.init();
    roadHdLaneCenter = module.get<RoadHdLaneCenter>(RoadHdLaneCenter);
    dataSource = module.get<DataSource>(DataSource);
    query = dataSource.createQueryBuilder();

    spyAddFilterRoadNameQuery = jest.spyOn(RoadName, "addFilterRoadNameQuery");
  });

  afterEach(async () => {
    await module.close();
  });

  it("should be defined", () => {
    expect(roadHdLaneCenter).toBeDefined();
  });

  it("道路名および交通規制情報が未指定で、roadSegmentId=5758を指定した場合に、当該データが取得できること", async () => {
    roadHdLaneCenter.createPropertiesQuery(query, {}, mockSchemaRelation);

    // 期待値（1つ目、2つ目）
    const expectedValue = [
      {
        roadSegmentId: 5758,
        laneNumber: 1,
        minSeq: 0,
        maxSeq: 34,
        linkId: 3085600,
        direction: 1,
        classCode: 1,
        nameCode: 0,
        hasSpeed: 0,
        hasOneway: 0,
        hasNopass: 0,
        hasNoturn: 0,
        hasZone30: 0,
      },
      {
        roadSegmentId: 5758,
        laneNumber: 1,
        minSeq: 35,
        maxSeq: 56,
        linkId: 3085611,
        direction: 1,
        classCode: 1,
        nameCode: 0,
        hasSpeed: 0,
        hasOneway: 0,
        hasNopass: 0,
        hasNoturn: 0,
        hasZone30: 0,
      },
    ];

    // アサーションの呼び出し確認
    expect.assertions(2);
    // 実行して結果を比較
    query.andWhere("tg.roadSegmentId = 5758").addOrderBy("tg.laneNumber").addOrderBy("tg.minSequence");
    const rows = await query.getRawMany();
    for (let index = 0; index <= 1; index++) {
      expect(rows[index]).toEqual(expectedValue[index]);
    }
  });

  describe("道路名検索(roadName)による絞り込み", () => {
    it("道路名『島田金谷バイパス』を指定した場合に、RoadName.addFilterRoadNameQueryが呼ばれること", () => {
      // RoadName.addFilterRoadNameQueryが呼ばれることの確認
      roadHdLaneCenter.createPropertiesQuery(query, { roadName: "島田金谷バイパス" }, mockSchemaRelation);
      expect(spyAddFilterRoadNameQuery).toHaveBeenCalledWith(query, "島田金谷バイパス");
    });

    it("道路名『島田金谷バイパス』を指定した場合に、当該データが取得できること", async () => {
      roadHdLaneCenter.createPropertiesQuery(query, { roadName: "島田金谷バイパス" }, mockSchemaRelation);

      // 期待値（1つ目、2つ目）
      const expectedValue = [
        {
          roadSegmentId: 6238,
          laneNumber: 1,
          minSeq: 0,
          maxSeq: 117,
          linkId: 6676212,
          direction: 1,
          classCode: 1,
          nameCode: 166974,
          hasSpeed: 0,
          hasOneway: 0,
          hasNopass: 0,
          hasNoturn: 0,
          hasZone30: 0,
        },
        {
          roadSegmentId: 23240,
          laneNumber: 1,
          minSeq: 177,
          maxSeq: 295,
          linkId: 6676212,
          direction: 1,
          classCode: 1,
          nameCode: 166974,
          hasSpeed: 0,
          hasOneway: 0,
          hasNopass: 0,
          hasNoturn: 0,
          hasZone30: 0,
        },
      ];

      // アサーションの呼び出し確認
      expect.assertions(2);
      // 実行して結果を比較
      query.addOrderBy("tg.roadSegmentId").addOrderBy("tg.laneNumber").addOrderBy("tg.minSequence");
      const rows = await query.getRawMany();
      for (let index = 0; index <= 1; index++) {
        expect(rows[index]).toEqual(expectedValue[index]);
      }
    });
  });

  describe("交通規制情報(reg)による絞り込み", () => {
    describe.each`
      name                    | reg         | roadSegmentId | descriotion
      ${"速度制限"}           | ${"SPEED"}  | ${6264}       | ${"minSeq 0: 制限なし、 minSeq 13:制限あり"}
      ${"一方通行"}           | ${"ONEWAY"} | ${6151}       | ${"minSeq 0: 制限なし、 minSeq 31:制限あり"}
      ${"通行禁止"}           | ${"NOPASS"} | ${5963}       | ${"minSeq 0: 制限なし、 minSeq 785:制限あり"}
      ${"指定方向外進入禁止"} | ${"NOTURN"} | ${6105}       | ${"minSeq 0: 制限なし、 minSeq 16:制限あり"}
      ${"ゾーン30"}           | ${"ZONE30"} | ${6276}       | ${"minSeq 0: 制限なし、 minSeq 9:制限あり"}
    `("$name", ({ reg, roadSegmentId }) => {
      it(`reg『${reg}』が未指定で、roadSegmentId=${roadSegmentId}を指定した場合に、2データ取得できていること`, async () => {
        roadHdLaneCenter.createPropertiesQuery(query, {}, mockSchemaRelation);

        // アサーションの呼び出し確認
        expect.assertions(6);
        // 各パラメータが設定されていないことを確認
        const parameters = query.getParameters();
        expect(parameters.speed).toBeUndefined();
        expect(parameters.oneway).toBeUndefined();
        expect(parameters.nopass).toBeUndefined();
        expect(parameters.noturn).toBeUndefined();
        expect(parameters.zone30).toBeUndefined();
        // 実行して結果を比較
        const rows = await query.andWhere("tg.roadSegmentId = :roadSegmentId", { roadSegmentId }).addOrderBy("tg.minSequence").getRawMany();
        expect(rows.length).toBe(2);
      });

      it(`reg『${reg}』・roadSegmentId=${roadSegmentId}を指定した場合に、1データ取得できていること`, async () => {
        roadHdLaneCenter.createPropertiesQuery(query, { reg }, mockSchemaRelation);

        // アサーションの呼び出し確認
        expect.assertions(6);
        // 各パラメータが設定されていることを確認
        const parameters = query.getParameters();
        for (const column of roadRegulationTypes) {
          if (column === reg) {
            expect(parameters[column]).toBe(1);
          } else {
            expect(parameters[column]).toBeUndefined();
          }
        }
        // 実行して結果を比較
        const rows = await query.andWhere("tg.roadSegmentId = :roadSegmentId", { roadSegmentId }).addOrderBy("tg.minSequence").getRawMany();
        expect(rows.length).toBe(1);
      });
    });
  });
});
