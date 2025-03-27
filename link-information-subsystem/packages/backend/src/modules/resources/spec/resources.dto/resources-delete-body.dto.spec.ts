/* eslint-disable unused-imports/no-unused-vars */
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { SharedResourcesDeleteBodyDTO } from "../../dto/resources-delete-body.dto";

describe("ResourcesDeleteBodyDTO", () => {
  const data = {
    keyFilter: "mh-reservation-id",
  };
  describe("keyFilter", () => {
    it("keyFilterの項目が存在し正常な値がセットされている場合、エラーが発生しないこと", async () => {
      const errors = await validate(plainToInstance(SharedResourcesDeleteBodyDTO, data));
      expect(errors.length).toBe(0);
    });
    it("keyFilterの項目が存在し無効な値（数値）がセットされている場合、エラーが発生すること", async () => {
      const errors = await validate(plainToInstance(SharedResourcesDeleteBodyDTO, { ...data, keyFilter: 1 }));
      expect(errors.length).toBe(1);
    });
    it("keyFilterの項目が存在し空白がセットされている場合、エラーが発生すること", async () => {
      const errors = await validate(plainToInstance(SharedResourcesDeleteBodyDTO, { ...data, keyFilter: "" }));
      expect(errors.length).toBe(1);
    });
    it("keyFilterの項目が存在しない場合、エラーが発生すること", async () => {
      const { keyFilter, ...other } = data;
      const errors = await validate(plainToInstance(SharedResourcesDeleteBodyDTO, other));
      expect(errors.length).toBe(1);
    });
  });
});
