import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { RoadExtraTrafficGetParamDTO } from "../../dto/road.dto";

describe("RoadExtraTrafficGetParamDTO", () => {
  const baseParam = { roadSegmentId: 1 };

  it("数値の場合、エラーにならないこと。", async () => {
    const param = baseParam;
    const dto = plainToInstance(RoadExtraTrafficGetParamDTO, param);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it("数値以外の場合、エラーになること。", async () => {
    const param = { ...baseParam, roadSegmentId: "a" };
    const dto = plainToInstance(RoadExtraTrafficGetParamDTO, param);
    const errors = await validate(dto);
    expect(errors.length).toBe(1);
  });

  it("空の場合、エラーになること。", async () => {
    const param = { ...baseParam, roadSegmentId: undefined };
    const dto = plainToInstance(RoadExtraTrafficGetParamDTO, param);
    const errors = await validate(dto);
    expect(errors.length).toBe(1);
  });
});
