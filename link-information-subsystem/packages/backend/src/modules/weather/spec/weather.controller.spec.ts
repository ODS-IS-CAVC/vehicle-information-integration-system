import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CoordinateService } from "src/modules/util/coordinate.service";
import { CannotExecuteNotConnectedError, DataSource } from "typeorm";
import { plainToInstance } from "class-transformer";
import { WeatherController } from "../weather.controller";
import { HttpModule } from "@nestjs/axios";
import { SdRoadName } from "src/entities/sdmap/road-name.entity";
import { HdLaneCenterLine } from "src/entities/viewer/hd-lane-center-line.entity";
import { HdSdRoadLink } from "src/entities/viewer/hd-sd-road-link.entity";
import { RoadService } from "src/modules/road/road.service";
import { UtilModule } from "src/modules/util/util.module";
import { WeatherService } from "../weather.service";
import { WeatherListQueryDto } from "../dto/weather-query.dto";
import { BadRequestException, InternalServerErrorException, UnprocessableEntityException } from "@nestjs/common";

describe("WeatherController", () => {
  let controller: WeatherController;
  let service: WeatherService;
  const mockCoordinateService = jest.mocked(CoordinateService);
  const mockDataSource = jest.mocked(DataSource);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: "postgres",
          host: "database",
          port: 5432,
          username: "postgres",
          password: "postgres",
          database: "postgres",
          autoLoadEntities: true,
        }),
        TypeOrmModule.forFeature([HdLaneCenterLine, HdSdRoadLink, SdRoadName]),
        UtilModule,
        HttpModule,
      ],
      controllers: [WeatherController],
      providers: [
        WeatherService,
        RoadService,
        {
          provide: CoordinateService,
          useValue: mockCoordinateService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    controller = module.get<WeatherController>(WeatherController);
    service = module.get<WeatherService>(WeatherService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe("getWeatherRisk", () => {
    it("serviceのgetWeatherRisk関数が呼び出されること", async () => {
      const result: any = {
        type: "フィーチャID",
        features: [],
      };
      const queryDto = plainToInstance(WeatherListQueryDto, {
        mesh: "5439",
      });
      const spyService = jest.spyOn(service, "getWeatherRisk").mockReturnValue(Promise.resolve(result));
      await controller.getWeatherRisk(queryDto);
      expect(spyService).toHaveBeenCalled();
    });

    it("パスパラメータの指定が無い場合、BadRequestExceptionがThrowされること", async () => {
      const queryEmptyDto = plainToInstance(WeatherListQueryDto, {});

      const spyGetWeatherRiskBadRequest = jest.spyOn(service, "getWeatherRisk").mockImplementation(() => {
        throw new BadRequestException();
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.getWeatherRisk(queryEmptyDto)).rejects.toThrow(BadRequestException);
      // serviceのgetWeatherRiskが呼ばれることの確認
      expect(spyGetWeatherRiskBadRequest).toHaveBeenCalledWith(queryEmptyDto);
    });

    it("指定した行政区画コードが存在しない場合、UnprocessableEntityExceptionがThrowされること", async () => {
      const queryCityDto = plainToInstance(WeatherListQueryDto, { city: "40000" });

      const spyGetWeatherRiskUnprocessableEntity = jest.spyOn(service, "getWeatherRisk").mockImplementation(() => {
        throw new UnprocessableEntityException();
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.getWeatherRisk(queryCityDto)).rejects.toThrow(UnprocessableEntityException);
      // serviceのgetWeatherRiskが呼ばれることの確認
      expect(spyGetWeatherRiskUnprocessableEntity).toHaveBeenCalledWith(queryCityDto);
    });

    it("DB接続が失敗した場合、InternalServerErrorExceptionがThrowされること", async () => {
      const queryDto = plainToInstance(WeatherListQueryDto, {
        mesh: 533946,
      });

      const spyGetWeatherRiskNotConnected = jest.spyOn(service, "getWeatherRisk").mockImplementation(() => {
        throw new CannotExecuteNotConnectedError("DB接続エラー");
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.getWeatherRisk(queryDto)).rejects.toThrow(InternalServerErrorException);
      // serviceのgetWeatherRiskが呼ばれることの確認
      expect(spyGetWeatherRiskNotConnected).toHaveBeenCalledWith(queryDto);
    });
  });
});
