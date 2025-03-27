import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UtilModule } from "src/modules/util/util.module";
import { plainToInstance } from "class-transformer";
import { WeatherService } from "../weather.service";
import { WeatherController } from "../weather.controller";
import { SdRoadName } from "src/entities/sdmap/road-name.entity";
import { HdLaneCenterLine } from "src/entities/viewer/hd-lane-center-line.entity";
import { HdSdRoadLink } from "src/entities/viewer/hd-sd-road-link.entity";
import { HttpModule } from "@nestjs/axios";
import { WeatherListQueryDto } from "../dto/weather-query.dto";
import { BadRequestException, UnprocessableEntityException } from "@nestjs/common";
import { LoggerService } from "src/modules/util/logger/logger.service";

describe("WeatherService", () => {
  let service: WeatherService;
  jest.setTimeout(60000);

  beforeEach(async () => {
    jest.setTimeout(60000);
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: "postgres",
          host: "10.71.80.38",
          port: 15432,
          username: "postgres",
          password: "postgres",
          database: "DMDB",
          autoLoadEntities: true,
        }),
        TypeOrmModule.forFeature([HdLaneCenterLine, HdSdRoadLink, SdRoadName]),
        UtilModule,
        HttpModule,
      ],
      controllers: [WeatherController],
      providers: [WeatherService, UtilModule, LoggerService],
    }).compile();

    service = module.get<WeatherService>(WeatherService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getWeatherRisk", () => {
    it("リクエスト指定がない場合、400: BadRequestが返却されること", async () => {
      const queryDto = plainToInstance(WeatherListQueryDto, undefined);
      await expect(service.getWeatherRisk(queryDto)).rejects.toThrow(BadRequestException);
    });

    it("リクエスト内容がbbox指定の場合で、正常に値が取得できること", async () => {
      const queryDto = plainToInstance(WeatherListQueryDto, { bbox: "135,35,136,36" });
      const result = await service.getWeatherRisk(queryDto);
      expect(result).not.toBe("");
    });

    it("リクエスト内容がbbox指定の場合で、検索結果が0件の場合、空オブジェクトが返却されること", async () => {
      const queryDto = plainToInstance(WeatherListQueryDto, { bbox: "140,50,141,51" });
      expect(await service.getWeatherRisk(queryDto)).toStrictEqual({});
    });

    it("リクエスト内容がmesh指定の場合で、検索結果が0件の場合、空オブジェクトが返却されること", async () => {
      const queryDto = plainToInstance(WeatherListQueryDto, { mesh: "6542" });
      expect(await service.getWeatherRisk(queryDto)).toStrictEqual({});
    });

    it("リクエスト内容がmesh指定の場合で、正常に値が取得できること", async () => {
      const queryDto = plainToInstance(WeatherListQueryDto, { mesh: "5339" });
      const result = await service.getWeatherRisk(queryDto);
      expect(result).not.toBe("");
    });

    it("リクエスト内容がcity指定の場合で、正常に値が取得できること", async () => {
      const queryDto = plainToInstance(WeatherListQueryDto, { city: "22203" });
      const result = await service.getWeatherRisk(queryDto);
      expect(result).not.toBe("");
    });

    it("リクエスト内容がcity指定の場合で、検索結果が0件の場合、空オブジェクトが返却されること", async () => {
      const queryDto = plainToInstance(WeatherListQueryDto, { city: "11101" });
      expect(await service.getWeatherRisk(queryDto)).toStrictEqual({});
    });

    it("リクエスト内容が存在しないcity指定の場合、422: UnprocessableEntityが返却されること", async () => {
      const queryDto = plainToInstance(WeatherListQueryDto, { city: "40000" });
      await expect(service.getWeatherRisk(queryDto)).rejects.toThrow(UnprocessableEntityException);
    });

    it("リクエスト内容がvoxel指定の場合で、検索結果が0件の場合、空オブジェクトが返却されること", async () => {
      const queryDto = plainToInstance(WeatherListQueryDto, { f: 0, x: 931113, y: 413561, z: 20 });
      expect(await service.getWeatherRisk(queryDto)).toStrictEqual({});
    });
  });
});
