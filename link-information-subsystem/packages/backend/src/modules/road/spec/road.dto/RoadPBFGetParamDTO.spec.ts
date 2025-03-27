import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { MAP_SOURCE } from "src/consts/map.const";
import { RoadPBFGetParamDTO } from "../../dto/road.dto";

describe("RoadPBFGetParamDTO", () => {
  const baseParam = { sourceId: MAP_SOURCE.HD_LANE_CENTER, x: 10000, y: 5000, z: 16 };
  describe("sourceId", () => {
    it.each`
      sourceId                          | sourceName
      ${MAP_SOURCE.HD_LANE_CENTER}      | ${"HD車線中心線"}
      ${MAP_SOURCE.HD_LANE_LINE}        | ${"区画線"}
      ${MAP_SOURCE.HD_ROAD_EDGE}        | ${"HD道路縁"}
      ${MAP_SOURCE.HD_INTERSECTION}     | ${"HD交差点"}
      ${MAP_SOURCE.HD_PAVEMENT_MARKING} | ${"HD路面標識"}
      ${MAP_SOURCE.HD_SIGN}             | ${"HD道路標識"}
      ${MAP_SOURCE.SD_ROAD_LINK}        | ${"SDリンク"}
      ${MAP_SOURCE.SD_ROAD_NODE}        | ${"SDノード"}
      ${MAP_SOURCE.TRAFFIC}             | ${"交通渋滞・規制情報"}
      ${MAP_SOURCE.CONSTRUCTION_EVENT}  | ${"工事行事予定情報"}
      ${MAP_SOURCE.ENTRY_EXIT}          | ${"入口出口閉鎖情報"}
      ${MAP_SOURCE.TRIP_TIME}           | ${"旅行時間情報"}
      ${MAP_SOURCE.WINTER_CLOSURE}      | ${"冬季閉鎖情報"}
    `("sourceIdが[$sourceId]の場合、エラーにならないこと。", async ({ sourceId }) => {
      const dto = plainToInstance(RoadPBFGetParamDTO, { ...baseParam, sourceId });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  const keys = ["x", "y", "z"];
  keys.forEach((key) => {
    it("数値の場合エラーにならないこと。", async () => {
      const param = { ...baseParam };
      param[key] = 16;
      const dto = plainToInstance(RoadPBFGetParamDTO, param);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it("数値以外の場合、エラーになること。", async () => {
      const param = { ...baseParam };
      param[key] = "a";
      const dto = plainToInstance(RoadPBFGetParamDTO, param);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
