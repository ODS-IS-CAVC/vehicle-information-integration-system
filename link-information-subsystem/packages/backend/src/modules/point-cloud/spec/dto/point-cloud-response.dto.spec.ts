import { plainToInstance } from "class-transformer";
import {
  CRSDto,
  DeleteResultPointCloudSplitResponseDto,
  GetResultPointCloudDlUrlResponseDto,
  GetResultPointCloudListResponseDto,
  GetResultPointCloudSplitStatusResponseDto,
  PointCloud,
  PointCloudGeometryDto,
  PointCloudProperty,
  PutResultPointCloudSplitResponseDto,
  SplitStatus,
} from "../../dto/point-cloud-response.dto";

describe("point-cloud-query.dto", () => {
  describe("CRSDto", () => {
    it("インスタンス化が正常に成功すること", async () => {
      const request = {};
      const dto = plainToInstance(CRSDto, request);
      expect(dto).toBeDefined();
    });
  });
  describe("PointCloudGeometryDto", () => {
    it("インスタンス化が正常に成功すること", async () => {
      const request = {};
      const dto = plainToInstance(PointCloudGeometryDto, request);
      expect(dto).toBeDefined();
    });
  });
  describe("PutResultPointCloudSplitResponseDto", () => {
    it("インスタンス化が正常に成功すること", async () => {
      const request = {};
      const dto = plainToInstance(PutResultPointCloudSplitResponseDto, request);
      expect(dto).toBeDefined();
    });
  });
  describe("GetResultPointCloudDlUrlResponseDto", () => {
    it("インスタンス化が正常に成功すること", async () => {
      const request = {};
      const dto = plainToInstance(GetResultPointCloudDlUrlResponseDto, request);
      expect(dto).toBeDefined();
    });
  });
  describe("GetResultPointCloudSplitStatusResponseDto", () => {
    it("インスタンス化が正常に成功すること", async () => {
      const request = {};
      const dto = plainToInstance(GetResultPointCloudSplitStatusResponseDto, request);
      expect(dto).toBeDefined();
    });
  });
  describe("DeleteResultPointCloudSplitResponseDto", () => {
    it("インスタンス化が正常に成功すること", async () => {
      const request = {};
      const dto = plainToInstance(DeleteResultPointCloudSplitResponseDto, request);
      expect(dto).toBeDefined();
    });
  });
  describe("PointCloudProperty", () => {
    it("インスタンス化が正常に成功すること", async () => {
      const request = {};
      const dto = plainToInstance(PointCloudProperty, request);
      expect(dto).toBeDefined();
    });
  });
  describe("PointCloud", () => {
    it("インスタンス化が正常に成功すること", async () => {
      const request = {};
      const dto = plainToInstance(PointCloud, request);
      expect(dto).toBeDefined();
    });
  });
  describe("GetResultPointCloudListResponseDto", () => {
    it("インスタンス化が正常に成功すること", async () => {
      const request = {};
      const dto = plainToInstance(GetResultPointCloudListResponseDto, request);
      expect(dto).toBeDefined();
    });
  });
  describe("SplitStatus", () => {
    it("インスタンス化が正常に成功すること", async () => {
      const request = {};
      const dto = plainToInstance(SplitStatus, request);
      expect(dto).toBeDefined();
    });
  });
});
