import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { WeatherModule } from "../weather.module";
import { SdRoadName } from "src/entities/sdmap/road-name.entity";
import { HdLaneCenterLine } from "src/entities/viewer/hd-lane-center-line.entity";
import { HdSdRoadLink } from "src/entities/viewer/hd-sd-road-link.entity";
import { WeatherController } from "../weather.controller";
import { WeatherService } from "../weather.service";

describe("WeatherModule", () => {
  let module: TestingModule;
  beforeEach(async () => {
    module = await Test.createTestingModule({
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
        WeatherModule,
      ],
    }).compile();
  });
  it("should compile the module", async () => {
    expect(module).toBeDefined();
    expect(module.get(WeatherController)).toBeInstanceOf(WeatherController);
    expect(module.get(WeatherService)).toBeInstanceOf(WeatherService);
  });
});
