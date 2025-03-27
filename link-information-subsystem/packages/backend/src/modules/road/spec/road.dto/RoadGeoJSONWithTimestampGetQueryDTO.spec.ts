import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { RoadGeoJSONWithTimestampGetQueryDTO } from "../../dto/road.dto";

describe("RoadGeoJSONWithTimestampGetQueryDTO", () => {
  describe("startTimestamp", () => {
    it("検索対象期間の開始と終了、どちらもセットされている場合、エラーにならないこと。", async () => {
      // startTimestamp、 endTimestampのみの場合エラーになるため、city追加
      const query = {
        startTimestamp: "2024-11-01T00:00:00Z",
        endTimestamp: "2024-11-30T23:59:59Z",
        city: 14104,
      };
      const dto = plainToInstance(RoadGeoJSONWithTimestampGetQueryDTO, query);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it("検索対象期間終了が開始より早い場合、エラーになること。", async () => {
      const query = {
        startTimestamp: "2024-12-01T00:00:00Z",
        endTimestamp: "2024-11-30T23:59:59Z",
      };
      const dto = plainToInstance(RoadGeoJSONWithTimestampGetQueryDTO, query);
      const errors = await validate(dto);
      expect(errors.length).toBe(2);
    });

    it("検索対象期間の開始とタイムスタンプがセットされている場合、エラーになること。", async () => {
      // startTimestamp、timestampのみの場合エラーになるため、city追加
      const query = {
        startTimestamp: "2024-11-01T00:00:00Z",
        timestamp: "2024-11-30T23:59:59Z",
        city: 14104,
      };
      const dto = plainToInstance(RoadGeoJSONWithTimestampGetQueryDTO, query);
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
    });

    it("検索対象期間の開始のみがセットされている場合、エラーになること。", async () => {
      const query = {
        startTimestamp: "2024-11-01T00:00:00Z",
      };
      const dto = plainToInstance(RoadGeoJSONWithTimestampGetQueryDTO, query);
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
    });

    it("検索対象期間の開始がISO 8601の表現ではない場合、エラーになること", async () => {
      // startTimestamp、endTimestampのみの場合エラーになるため、city追加
      const query = {
        // 時間部分に無効な区切り文字
        startTimestamp: "2024-11-01T08-22-33Z",
        endTimestamp: "2024-11-30T23:59:59Z",
        city: 14104,
      };
      const dto = plainToInstance(RoadGeoJSONWithTimestampGetQueryDTO, query);
      const errors = await validate(dto);

      expect(errors.length).toBe(1);
    });
  });

  describe("endTimestamp", () => {
    it("検索対象期間の終了とタイムスタンプがセットされている場合、エラーになること。", async () => {
      // timestamp、endTimestampのみの場合エラーになるため、city追加
      const query = {
        timestamp: "2024-11-01T00:00:00Z",
        endTimestamp: "2024-11-30T23:59:59Z",
        city: 14104,
      };
      const dto = plainToInstance(RoadGeoJSONWithTimestampGetQueryDTO, query);
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
    });

    it("検索対象期間の終了のみがセットされている場合、エラーになること。", async () => {
      const query = {
        endTimestamp: "2024-11-30T23:59:59Z",
      };
      const dto = plainToInstance(RoadGeoJSONWithTimestampGetQueryDTO, query);
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
    });

    it("検索対象期間の終了がISO 8601の表現ではない場合、エラーになること", async () => {
      // startTimestamp、endTimestampのみの場合エラーになるため、city追加
      const query = {
        startTimestamp: "2024-11-01T08:22:33Z",
        // 時間部分に無効な区切り文字
        endTimestamp: "2024-11-30T23-59-59Z",
        city: 14104,
      };
      const dto = plainToInstance(RoadGeoJSONWithTimestampGetQueryDTO, query);
      const errors = await validate(dto);

      expect(errors.length).toBe(1);
    });
  });

  describe("IsGeometryOptional", () => {
    it("startTimestampのみ存在する場合、エラーになること", async () => {
      const startTimestampQuery = { startTimestamp: "2024-01-21T11:22:33Z" };
      const dto = plainToInstance(RoadGeoJSONWithTimestampGetQueryDTO, startTimestampQuery);
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
    });

    it("endTimestampのみ存在する場合、エラーになること", async () => {
      const endTimestampQuery = { endTimestamp: "2024-01-23T11:22:33Z" };
      const dto = plainToInstance(RoadGeoJSONWithTimestampGetQueryDTO, endTimestampQuery);
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
    });

    it("startTimestamp、endTimestamp、cityが存在する場合、エラーにならないこと", async () => {
      const query = { startTimestamp: "2024-01-21T11:22:33Z", endTimestamp: "2024-01-23T11:22:33Z", city: 14104 };
      const dto = plainToInstance(RoadGeoJSONWithTimestampGetQueryDTO, query);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});
