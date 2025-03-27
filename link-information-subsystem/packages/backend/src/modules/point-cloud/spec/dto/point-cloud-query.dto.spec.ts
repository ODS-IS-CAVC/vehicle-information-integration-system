import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { DeletePointCloudSplitQueryDto, GetPointCloudDlUrlQueryDto, GetPointCloudListQueryDto } from "../../dto/point-cloud-query.dto";

describe("point-cloud-query.dto", () => {
  describe("GetPointCloudDlUrlQueryDto", () => {
    it("リクエスト内容の申請IDが存在する場合、エラーにならないこと", async () => {
      const request = { requestId: 1 };
      const dto = plainToInstance(GetPointCloudDlUrlQueryDto, request);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it("リクエスト内容の申請IDが存在しない場合、エラーになること", async () => {
      const request = {};
      const dto = plainToInstance(GetPointCloudDlUrlQueryDto, request);
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
    });
  });

  describe("GetPointCloudListQueryDto", () => {
    it("リクエスト内容がlat・lonだけの場合、エラーにならないこと", async () => {
      const request = {
        lat: 30.123456789,
        lon: 130.123456789,
      };
      const dto = plainToInstance(GetPointCloudListQueryDto, request);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it("リクエスト内容がbboxだけの場合、エラーにならないこと", async () => {
      const request = {
        bbox: "130,30,140,40",
      };
      const dto = plainToInstance(GetPointCloudListQueryDto, request);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it("リクエスト内容がcityだけの場合、エラーにならないこと", async () => {
      const request = {
        city: "10100",
      };
      const dto = plainToInstance(GetPointCloudListQueryDto, request);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it("リクエスト内容がmeshだけの場合、エラーにならないこと", async () => {
      const request = {
        mesh: "5439",
      };
      const dto = plainToInstance(GetPointCloudListQueryDto, request);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it("リクエスト内容が全て指定されている場合、エラーになること", async () => {
      const request = {
        lat: 30.123456789,
        lon: 130.123456789,
        bbox: "130,30,140,40",
        city: "10100",
        mesh: "5439",
      };
      const dto = plainToInstance(GetPointCloudListQueryDto, request);
      const errors = await validate(dto);
      expect(errors.length).toBe(3);
    });

    it("リクエスト内容のbboxの形式が正しくない場合、エラーになること", async () => {
      const request = {
        bbox: "130,30,140",
      };
      const dto = plainToInstance(GetPointCloudListQueryDto, request);
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
    });

    it("リクエスト内容のcityの形式が正しくない場合、エラーになること", async () => {
      const request = {
        city: "1010",
      };
      const dto = plainToInstance(GetPointCloudListQueryDto, request);
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
    });

    it("リクエスト内容のmeshの形式が正しくない場合、エラーになること", async () => {
      const request = {
        mesh: "123",
      };
      const dto = plainToInstance(GetPointCloudListQueryDto, request);
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
    });
  });

  describe("DeletePointCloudSplitQueryDto", () => {
    it("リクエスト内容の申請IDが存在する場合、エラーにならないこと", async () => {
      const request = { requestId: 1 };
      const dto = plainToInstance(DeletePointCloudSplitQueryDto, request);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it("リクエスト内容の申請IDが存在しない場合、エラーになること", async () => {
      const request = {};
      const dto = plainToInstance(DeletePointCloudSplitQueryDto, request);
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
    });
  });
});
