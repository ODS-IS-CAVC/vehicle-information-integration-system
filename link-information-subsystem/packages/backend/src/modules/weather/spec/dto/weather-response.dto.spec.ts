import { plainToInstance } from "class-transformer";
import {
  GetWeatherRiskResponseDto,
  WaterFilmThicknessProps,
  WeatherGeometryDto,
  WeatherRisk,
  WindProps,
} from "../../dto/weather-response.dto";

describe("weather-response.dto", () => {
  describe("WeatherGeometryDto", () => {
    it("インスタンス化が正常に成功すること", async () => {
      const request = {};
      const dto = plainToInstance(WeatherGeometryDto, request);
      expect(dto).toBeDefined();
    });
  });
  describe("WaterFilmThicknessProps", () => {
    it("インスタンス化が正常に成功すること", async () => {
      const request = {};
      const dto = plainToInstance(WaterFilmThicknessProps, request);
      expect(dto).toBeDefined();
    });
  });
  describe("WindProps", () => {
    it("インスタンス化が正常に成功すること", async () => {
      const request = {};
      const dto = plainToInstance(WindProps, request);
      expect(dto).toBeDefined();
    });
  });
  describe("WeatherRisk", () => {
    it("インスタンス化が正常に成功すること", async () => {
      const request = {};
      const dto = plainToInstance(WeatherRisk, request);
      expect(dto).toBeDefined();
    });
  });
  describe("GetWeatherRiskResponseDto", () => {
    it("インスタンス化が正常に成功すること", async () => {
      const request = {};
      const dto = plainToInstance(GetWeatherRiskResponseDto, request);
      expect(dto).toBeDefined();
    });
  });
});
