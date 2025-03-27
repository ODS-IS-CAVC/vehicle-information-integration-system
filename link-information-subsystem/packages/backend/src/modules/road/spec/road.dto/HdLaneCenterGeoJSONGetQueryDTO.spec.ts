import { plainToInstance } from "class-transformer";
import { HdLaneCenterGeoJSONGetQueryDTO } from "../../dto/road.dto";
import { validate } from "class-validator";
import { Reg } from "src/consts/map.const";

describe("HdLaneCenterGeoJSONGetQueryDTO", () => {
  const baseQuery = {};

  describe("reg", () => {
    it("交通規制情報が存在しない場合、エラーにならないこと。", async () => {
      const query = { ...baseQuery };
      delete query["reg"];

      const dto = plainToInstance(HdLaneCenterGeoJSONGetQueryDTO, query);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it.each`
      reg
      ${"SPEED"}
      ${"ONEWAY"}
      ${"NOPASS"}
      ${"NOTURN"}
      ${"ZONE30"}
    `("交通規制情報が[$reg]の場合、エラーにならないこと。", async ({ reg }) => {
      // regのみ指定がある場合エラーになるためcityを追加
      const dto = plainToInstance(HdLaneCenterGeoJSONGetQueryDTO, { ...baseQuery, reg, city: 14104 });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it.each`
      reg          | description
      ${"INVALID"} | ${"不正な交通規制情報（存在しない値）"}
      ${123}       | ${"交通規制情報の型が不正"}
    `("交通規制情報が[$reg]の場合、エラーが発生すること。", async ({ reg }) => {
      const dto = plainToInstance(HdLaneCenterGeoJSONGetQueryDTO, { ...baseQuery, reg });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe("IsGeometryOptional", () => {
    it("regのみ存在する場合、エラーが発生すること", async () => {
      const regQuery = { reg: Reg.oneway };
      const dto = plainToInstance(HdLaneCenterGeoJSONGetQueryDTO, regQuery);
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
    });

    it("regとcityが存在する場合、エラーにならないこと", async () => {
      const regQuery = { reg: Reg.oneway, city: 14104 };
      const dto = plainToInstance(HdLaneCenterGeoJSONGetQueryDTO, regQuery);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});
