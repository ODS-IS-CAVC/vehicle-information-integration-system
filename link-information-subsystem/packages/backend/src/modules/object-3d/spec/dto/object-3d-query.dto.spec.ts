import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { DeleteObjectOperationQueryDto, GetObjectOperationQueryDto, GetObjectUpUrlQueryDto } from "../../dto/object-3d-query.dto";

describe("object-3d-query.dto", () => {
  describe("GetObjectOperationQueryDto", () => {
    it("リクエスト内容の点群IDが存在しない場合、エラーになること", async () => {
      const request = {};
      const dto = plainToInstance(GetObjectOperationQueryDto, request);
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
    });

    it("リクエスト内容の点群IDが存在する場合、エラーにならないこと", async () => {
      const request = {
        pointCloudUniqueId: "1",
      };
      const dto = plainToInstance(GetObjectOperationQueryDto, request);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe("GetObjectUpUrlQueryDto", () => {
    it("リクエスト内容のファイル名が存在しない場合、エラーになること", async () => {
      const request = {};
      const dto = plainToInstance(GetObjectUpUrlQueryDto, request);
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
    });

    it("リクエスト内容のファイル名が存在する場合、エラーにならないこと", async () => {
      const request = {
        filename: "test111.obj",
      };
      const dto = plainToInstance(GetObjectUpUrlQueryDto, request);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe("DeleteObjectOperationQueryDto", () => {
    it("リクエスト内容の操作結果IDが存在しない場合、エラーになること", async () => {
      const request = {};
      const dto = plainToInstance(DeleteObjectOperationQueryDto, request);
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
    });

    it("リクエスト内容の操作結果IDが存在する場合、エラーにならないこと", async () => {
      const request = {
        operationId: 0,
      };
      const dto = plainToInstance(DeleteObjectOperationQueryDto, request);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});
