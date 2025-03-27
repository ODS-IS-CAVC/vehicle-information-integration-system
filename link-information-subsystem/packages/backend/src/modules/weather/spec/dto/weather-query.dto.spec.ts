import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { WeatherListQueryDto } from "../../dto/weather-query.dto";

describe("weather-query.dto", () => {
  describe("WeatherListQueryDto", () => {
    it("リクエスト内容のbboxが存在しない場合、エラーにならないこと", async () => {
      const request = {
        x: "1",
        y: "1",
        z: "1",
        f: "1",
      };
      const dto = plainToInstance(WeatherListQueryDto, request);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
    it("リクエスト内容のvoxel xが存在しない場合、エラーにならないこと", async () => {
      const request = {
        bbox: "130,30,131,31",
      };
      const dto = plainToInstance(WeatherListQueryDto, request);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
    it("リクエスト内容のvoxel yが存在しない場合、エラーにならないこと", async () => {
      const request = {
        bbox: "130,30,131,31",
      };
      const dto = plainToInstance(WeatherListQueryDto, request);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
    it("リクエスト内容のvoxel zが存在しない場合、エラーにならないこと", async () => {
      const request = {
        bbox: "130,30,131,31",
      };
      const dto = plainToInstance(WeatherListQueryDto, request);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
    it("リクエスト内容のvoxel fが存在しない場合、エラーにならないこと", async () => {
      const request = {
        bbox: "130,30,131,31",
      };
      const dto = plainToInstance(WeatherListQueryDto, request);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
    it("リクエスト内容のcityが存在しない場合、エラーにならないこと", async () => {
      const request = {
        bbox: "130,30,131,31",
      };
      const dto = plainToInstance(WeatherListQueryDto, request);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
    it("リクエスト内容のmeshが存在しない場合、エラーにならないこと", async () => {
      const request = {
        bbox: "130,30,131,31",
      };
      const dto = plainToInstance(WeatherListQueryDto, request);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
    it("リクエスト内容のtimestampが存在しない場合、エラーにならないこと", async () => {
      const request = {
        bbox: "130,30,131,31",
      };
      const dto = plainToInstance(WeatherListQueryDto, request);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
    it("リクエスト内容のroadNameが存在しない場合、エラーにならないこと", async () => {
      const request = {
        bbox: "130,30,131,31",
      };
      const dto = plainToInstance(WeatherListQueryDto, request);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
    it("リクエスト内容のbboxの形式が正しくない場合、エラーになること", async () => {
      const request = {
        bbox: "130,30,140",
      };
      const dto = plainToInstance(WeatherListQueryDto, request);
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
    });
    it("リクエスト内容のcityの形式が正しくない場合、エラーになること", async () => {
      const request = {
        city: "1010",
      };
      const dto = plainToInstance(WeatherListQueryDto, request);
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
    });
    it("リクエスト内容のmeshの形式が正しくない場合、エラーになること", async () => {
      const request = {
        mesh: "123",
      };
      const dto = plainToInstance(WeatherListQueryDto, request);
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
    });
    it("リクエスト内容のbboxとmeshが同時に存在する場合、エラーになること", async () => {
      const request = {
        bbox: "130,30,131,31",
        mesh: "1234",
      };
      const dto = plainToInstance(WeatherListQueryDto, request);
      const errors = await validate(dto);
      expect(errors.length).toBe(2);
    });
    it("リクエスト内容のbboxとcityが同時に存在する場合、エラーになること", async () => {
      const request = {
        bbox: "130,30,131,31",
        city: "12345",
      };
      const dto = plainToInstance(WeatherListQueryDto, request);
      const errors = await validate(dto);
      expect(errors.length).toBe(2);
    });
    it("リクエスト内容のbboxとvoxcelが同時に存在する場合、エラーになること", async () => {
      const request = {
        bbox: "130,30,131,31",
        x: "1",
        y: "1",
        z: "1",
        f: "1",
      };
      const dto = plainToInstance(WeatherListQueryDto, request);
      const errors = await validate(dto);
      expect(errors.length).toBe(4);
    });
    it("リクエスト内容がtimestampのみ存在する場合、エラーになること", async () => {
      const dto = plainToInstance(WeatherListQueryDto, { timestamp: new Date() });
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
    });
    it("リクエスト内容がroadNameのみ存在する場合、エラーになること", async () => {
      const dto = plainToInstance(WeatherListQueryDto, { roadName: "東名高速" });
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
    });
  });
});
