import { plainToInstance } from "class-transformer";
import { PutPointCloudSplitBodyDto } from "../../dto/point-cloud-body.dto";
import { validate } from "class-validator";

describe("point-cloud-body.dto", () => {
  describe("PutPointCloudSplitBodyDto", () => {
    it("リクエスト内容の始点が存在しない場合、エラーになること", async () => {
      const request = {
        endPoint: { lat: 31.123456789, lon: 131.123456789 },
        pointCloudUniqueId: 1,
      };
      const dto = plainToInstance(PutPointCloudSplitBodyDto, request);
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
    });

    it("リクエスト内容の終点が存在しない場合、エラーになること", async () => {
      const request = {
        startPoint: { lat: 30.123456789, lon: 130.123456789 },
        pointCloudUniqueId: 1,
      };
      const dto = plainToInstance(PutPointCloudSplitBodyDto, request);
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
    });

    it("リクエスト内容の点群IDが存在しない場合、エラーになること", async () => {
      const request = {
        startPoint: { lat: 30.123456789, lon: 130.123456789 },
        endPoint: { lat: 31.123456789, lon: 131.123456789 },
      };
      const dto = plainToInstance(PutPointCloudSplitBodyDto, request);
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
    });
  });
});
