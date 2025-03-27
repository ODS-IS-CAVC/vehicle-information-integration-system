/* eslint-disable unused-imports/no-unused-vars */
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { SharedResourcesPutResponseDTO } from "../../dto/resources-put-response.dto";

describe("ResourcesPutResponseDTO", () => {
  const base64 =
    "JTdCJTIybW9iaWxpdHlIdWJJZCUyMiUzQSUyMkUxQS0wMDEtVSUyMiUyQyUyMmZyZWlnaHRJZCUyMiUzQSUyMjEyMy00NTYtNzg5JTIyJTJDJTIydHJ1Y2tJZCUyMiUzQSUyMiVFNSU5MyU4MSVFNSVCNyU5RCUyMDEwMiUyMCVFMyU4MSU4MiUyMDEwLTA5JTIyJTJDJTIyc2l6ZUNsYXNzJTIyJTNBJTIybGFyZ2UyMDUwQ2xhc3MlMjIlN0Q=";
  const data = {
    dataModelType: "test1",
    attribute: {
      category: "mobilityhub",
      statuses: [
        {
          key: "A0JYEyM3-21453354856",
          value: base64,
          validFrom: "2024-10-21T09:00:00.000Z",
          validUntil: "2024-10-21T10:00:00.000Z",
        },
      ],
    },
  };

  it("全ての項目が存在し正常な値がセットされている場合、エラーが発生しないこと", async () => {
    const errors = await validate(plainToInstance(SharedResourcesPutResponseDTO, data));
    expect(errors.length).toBe(0);
  });
  describe("dataModelType", () => {
    it("dataModelTypeの項目が存在し無効な値がセットされている場合、エラーが発生すること", async () => {
      const errors = await validate(plainToInstance(SharedResourcesPutResponseDTO, { ...data, dataModelType: "badDataModelType" }));
      expect(errors.length).toBe(1);
    });
    it("dataModelTypeの項目が存在しない場合、エラーが発生すること", async () => {
      const { dataModelType, ...other } = data;
      const errors = await validate(plainToInstance(SharedResourcesPutResponseDTO, other));
      expect(errors.length).toBe(1);
    });
  });
  describe("attribute", () => {
    it("attributeの項目が存在し無効な値がセットされている場合、エラーが発生すること", async () => {
      const errors = await validate(
        plainToInstance(SharedResourcesPutResponseDTO, {
          ...data,
          dataModelType: "test1",
          attribute: {
            badCategory: "mobilityhub",
            badStatuses: [],
          },
        }),
      );
      expect(errors.length).toBe(1);
    });
    it("attributeの項目が存在しない場合、エラーが発生すること", async () => {
      const { attribute, ...other } = data;
      const errors = await validate(plainToInstance(SharedResourcesPutResponseDTO, other));
      expect(errors.length).toBe(1);
    });
  });
  describe("category", () => {
    it("categoryの項目が存在し無効な値がセットされている場合、エラーが発生すること", async () => {
      const errors = await validate(
        plainToInstance(SharedResourcesPutResponseDTO, {
          ...data,
          dataModelType: "test1",
          attribute: {
            ...data.attribute,
            category: "badcategory",
            statuses: [
              {
                key: "A0JYEyM3-21453354856",
                value: base64,
                validFrom: "2024-10-21T09:00:00.000Z",
                validUntil: "2024-10-21T10:00:00.000Z",
              },
            ],
          },
        }),
      );
      expect(errors.length).toBe(1);
    });
    it("categoryの項目が存在しない場合、エラーが発生すること", async () => {
      const {
        attribute: { category, ...attributeRest },
        ...other
      } = data;
      const errors = await validate(
        plainToInstance(SharedResourcesPutResponseDTO, {
          ...other,
          attribute: {
            ...attributeRest,
          },
        }),
      );
      expect(errors.length).toBe(1);
    });
  });
  describe("statuses", () => {
    it("statusesの項目が存在し無効な値がセットされている場合、エラーが発生すること", async () => {
      const errors = await validate(
        plainToInstance(SharedResourcesPutResponseDTO, {
          ...data,
          dataModelType: "test1",
          attribute: {
            ...data.attribute,
            category: "mobilityhub",
            statuses: [
              {
                badKey: "A0JYEyM3-21453354856",
                badValue: base64,
                badValidFrom: "2024-10-21T09:00:00.000Z",
                badValidUntil: "2024-10-21T10:00:00.000Z",
              },
            ],
          },
        }),
      );
      expect(errors.length).toBe(1);
    });
    it("statusesの項目が存在し値が配列の場合、エラーが発生しないこと", async () => {
      const errors = await validate(
        plainToInstance(SharedResourcesPutResponseDTO, {
          ...data,
          dataModelType: "test1",
          attribute: {
            ...data.attribute,
            category: "mobilityhub",
            statuses: [
              {
                key: "A0JYEyM3-21453354856",
                value: base64,
                validFrom: "2024-10-21T09:00:00.000Z",
                validUntil: "2024-10-21T10:00:00.000Z",
              },
              {
                key: "A0JYEyM3-21453354856",
                value: base64,
                validFrom: "2024-10-22T09:00:00.000Z",
                validUntil: "2024-10-23T10:00:00.000Z",
              },
            ],
          },
        }),
      );
      expect(errors.length).toBe(0);
    });
    it("statusesの項目が存在しない場合、エラーが発生すること", async () => {
      const {
        attribute: { statuses, ...attributeRest },
        ...other
      } = data;
      const errors = await validate(
        plainToInstance(SharedResourcesPutResponseDTO, {
          ...other,
          attribute: {
            ...attributeRest,
          },
        }),
      );
      expect(errors.length).toBe(1);
    });
  });
  describe("key", () => {
    it("keyの項目が存在し無効な値がセットされている場合、エラーが発生すること", async () => {
      const errors = await validate(
        plainToInstance(SharedResourcesPutResponseDTO, {
          ...data,
          dataModelType: "test1",
          attribute: {
            ...data.attribute,
            category: "mobilityhub",
            statuses: [
              {
                key: 1,
                value: base64,
                validFrom: "2024-10-21T09:00:00.000Z",
                validUntil: "2024-10-21T10:00:00.000Z",
              },
            ],
          },
        }),
      );
      expect(errors.length).toBe(1);
    });
    it("keyの項目が存在しない場合、エラーが発生すること", async () => {
      const errors = await validate(
        plainToInstance(SharedResourcesPutResponseDTO, {
          ...data,
          dataModelType: "test1",
          attribute: {
            ...data.attribute,
            category: "mobilityhub",
            statuses: [
              {
                value: base64,
                validFrom: "2024-10-21T09:00:00.000Z",
                validUntil: "2024-10-21T10:00:00.000Z",
              },
            ],
          },
        }),
      );
      expect(errors.length).toBe(1);
    });
  });
  describe("value", () => {
    it("valueの項目が存在し無効な値がセットされている場合、エラーが発生すること", async () => {
      const errors = await validate(
        plainToInstance(SharedResourcesPutResponseDTO, {
          ...data,
          dataModelType: "test1",
          attribute: {
            ...data.attribute,
            category: "mobilityhub",
            statuses: [
              {
                key: "A0JYEyM3-21453354856",
                value: 1,
                validFrom: "2024-10-21T09:00:00.000Z",
                validUntil: "2024-10-21T10:00:00.000Z",
              },
            ],
          },
        }),
      );
      expect(errors.length).toBe(1);
    });
    it("valueの項目が存在しない場合、エラーが発生すること", async () => {
      const errors = await validate(
        plainToInstance(SharedResourcesPutResponseDTO, {
          ...data,
          dataModelType: "test1",
          attribute: {
            ...data.attribute,
            category: "mobilityhub",
            statuses: [
              {
                key: "A0JYEyM3-21453354856",
                validFrom: "2024-10-21T09:00:00.000Z",
                validUntil: "2024-10-21T10:00:00.000Z",
              },
            ],
          },
        }),
      );
      expect(errors.length).toBe(1);
    });
  });
  describe("validFrom", () => {
    it("validFromの項目が存在し無効な日付形式の場合、エラーが発生すること", async () => {
      const errors = await validate(
        plainToInstance(SharedResourcesPutResponseDTO, {
          ...data,
          dataModelType: "test1",
          attribute: {
            ...data.attribute,
            category: "mobilityhub",
            statuses: [
              {
                key: "A0JYEyM3-21453354856",
                value: base64,
                validFrom: "2024/10/21",
                validUntil: "2024-10-21T10:00:00.000Z",
              },
            ],
          },
        }),
      );
      expect(errors.length).toBe(1);
    });
    it("validFromの項目が存在しない場合、エラーが発生すること", async () => {
      const errors = await validate(
        plainToInstance(SharedResourcesPutResponseDTO, {
          ...data,
          dataModelType: "test1",
          attribute: {
            ...data.attribute,
            category: "mobilityhub",
            statuses: [
              {
                key: "A0JYEyM3-21453354856",
                value: base64,
                validUntil: "2024-10-21T10:00:00.000Z",
              },
            ],
          },
        }),
      );
      expect(errors.length).toBe(1);
    });
  });
  describe("validUntil", () => {
    it("validUntilの項目が存在し無効な日付形式の場合、エラーが発生すること", async () => {
      const errors = await validate(
        plainToInstance(SharedResourcesPutResponseDTO, {
          ...data,
          dataModelType: "test1",
          attribute: {
            ...data.attribute,
            category: "mobilityhub",
            statuses: [
              {
                key: "A0JYEyM3-21453354856",
                value: base64,
                validFrom: "2024-10-21T10:00:00.000Z",
                validUntil: "2024/10/21",
              },
            ],
          },
        }),
      );
      expect(errors.length).toBe(1);
    });
    it("validUntilの項目が存在しない場合、エラーが発生すること", async () => {
      const errors = await validate(
        plainToInstance(SharedResourcesPutResponseDTO, {
          ...data,
          dataModelType: "test1",
          attribute: {
            ...data.attribute,
            category: "mobilityhub",
            statuses: [
              {
                key: "A0JYEyM3-21453354856",
                value: base64,
                validFrom: "2024-10-21T09:00:00.000Z",
              },
            ],
          },
        }),
      );
      expect(errors.length).toBe(1);
    });
  });
});
