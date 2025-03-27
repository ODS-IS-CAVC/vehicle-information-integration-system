import { plainToInstance } from "class-transformer";
import {
  DeleteResultObjectOperationResponseDto,
  Object3dResponseDTO,
  ObjectOperationResponseDto,
  GetResult3dObjectUpUrlResponseDto,
  PutResultObjectOperationResponseDto,
} from "../../dto/object-3d-response.dto";

describe("object-3d-query.dto", () => {
  describe("Object3dResponceDTO", () => {
    it("インスタンス化が正常に成功すること", async () => {
      const request = {};
      const dto = plainToInstance(Object3dResponseDTO, request);
      expect(dto).toBeDefined();
    });
  });
  describe("PutResult3dObjectResponseDto", () => {
    it("インスタンス化が正常に成功すること", async () => {
      const request = {};
      const dto = plainToInstance(GetResult3dObjectUpUrlResponseDto, request);
      expect(dto).toBeDefined();
    });
  });
  describe("PutResultObjectOperationResponseDto", () => {
    it("インスタンス化が正常に成功すること", async () => {
      const request = {};
      const dto = plainToInstance(PutResultObjectOperationResponseDto, request);
      expect(dto).toBeDefined();
    });
  });
  describe("ObjectOperationResponseDto", () => {
    it("インスタンス化が正常に成功すること", async () => {
      const request = {};
      const dto = plainToInstance(ObjectOperationResponseDto, request);
      expect(dto).toBeDefined();
    });
  });
  describe("DeleteResultObjectOperationResponseDto", () => {
    it("インスタンス化が正常に成功すること", async () => {
      const request = {};
      const dto = plainToInstance(DeleteResultObjectOperationResponseDto, request);
      expect(dto).toBeDefined();
    });
  });
});
