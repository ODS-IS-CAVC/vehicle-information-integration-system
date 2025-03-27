/* eslint-disable unused-imports/no-unused-vars */
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { SharedResourcesPutValueDTO } from "../../dto/resources-put-value.dto";

describe("SharedResourcesPutValueDTO", () => {
  const base64 =
    "JTdCJTIybW9iaWxpdHlIdWJJZCUyMiUzQSUyMkUxQS0wMDEtVSUyMiUyQyUyMmZyZWlnaHRJZCUyMiUzQSUyMjEyMy00NTYtNzg5JTIyJTJDJTIydHJ1Y2tJZCUyMiUzQSUyMiVFNSU5MyU4MSVFNSVCNyU5RCUyMDEwMiUyMCVFMyU4MSU4MiUyMDEwLTA5JTIyJTJDJTIyc2l6ZUNsYXNzJTIyJTNBJTIybGFyZ2UyMDUwQ2xhc3MlMjIlN0Q=";
  const data = {
    dataModelType: "test1",
    category: "mobilityhub",
    key: "A0JYEyM3-21453354856",
    value: base64,
    validFrom: "2024-10-21T09:00:00.000Z",
    validTo: "2024-10-21T10:00:00.000Z",
  };
  it("全ての項目が存在し正常な値がセットされている場合、エラーが発生しないこと", async () => {
    const errors = await validate(plainToInstance(SharedResourcesPutValueDTO, data));
    expect(errors.length).toBe(0);
  });
  describe("dataModelType", () => {
    it("dataModelTypeの項目が存在し無効な値がセットされている場合、エラーが発生すること", async () => {
      const errors = await validate(plainToInstance(SharedResourcesPutValueDTO, { ...data, dataModelType: "badDataModelType" }));
      expect(errors.length).toBe(1);
    });
    it("dataModelTypeの項目が存在しない場合、エラーが発生すること", async () => {
      const { dataModelType, ...other } = data;
      const errors = await validate(plainToInstance(SharedResourcesPutValueDTO, other));
      expect(errors.length).toBe(1);
    });
  });
  describe("category", () => {
    it("categoryの項目が存在し無効な値がセットされている場合、エラーが発生すること", async () => {
      const errors = await validate(plainToInstance(SharedResourcesPutValueDTO, { ...data, category: "badCategory" }));
      expect(errors.length).toBe(1);
    });
    it("categoryの項目が存在しない場合、エラーが発生すること", async () => {
      const { category, ...other } = data;
      const errors = await validate(plainToInstance(SharedResourcesPutValueDTO, other));
      expect(errors.length).toBe(1);
    });
  });
  describe("key", () => {
    it("keyの項目が存在し無効な値がセットされている場合、エラーが発生すること", async () => {
      const errors = await validate(plainToInstance(SharedResourcesPutValueDTO, { ...data, key: 1 }));
      expect(errors.length).toBe(1);
    });
    it("keyの項目が存在しない場合、エラーが発生すること", async () => {
      const { key, ...other } = data;
      const errors = await validate(plainToInstance(SharedResourcesPutValueDTO, other));
      expect(errors.length).toBe(1);
    });
  });
  describe("value", () => {
    it("valueの項目が存在し無効な値がセットされている場合、エラーが発生すること", async () => {
      const errors = await validate(plainToInstance(SharedResourcesPutValueDTO, { ...data, value: 1 }));
      expect(errors.length).toBe(1);
    });
    it("valueの項目が存在しない場合、エラーが発生すること", async () => {
      const { value, ...other } = data;
      const errors = await validate(plainToInstance(SharedResourcesPutValueDTO, other));
      expect(errors.length).toBe(1);
    });
  });
  describe("validFrom", () => {
    it("validFromの項目が存在し無効な日付形式の場合、エラーが発生すること", async () => {
      const errors = await validate(plainToInstance(SharedResourcesPutValueDTO, { ...data, validFrom: "2024/11/11" }));
      expect(errors.length).toBe(1);
    });
    it("validFromの項目が存在しない場合、エラーが発生すること", async () => {
      const { validFrom, ...other } = data;
      const errors = await validate(plainToInstance(SharedResourcesPutValueDTO, other));
      expect(errors.length).toBe(1);
    });
  });
  describe("validTo", () => {
    it("validToの項目が存在し無効な日付形式の場合、エラーが発生すること", async () => {
      const errors = await validate(plainToInstance(SharedResourcesPutValueDTO, { ...data, validTo: "2024/11/11" }));
      expect(errors.length).toBe(1);
    });
    it("validToの項目が存在しない場合、エラーが発生しないこと", async () => {
      const { validTo, ...other } = data;
      const errors = await validate(plainToInstance(SharedResourcesPutValueDTO, other));
      expect(errors.length).toBe(1);
    });
  });
});
