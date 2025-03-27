import { Module } from "@nestjs/common";
import { WeatherController } from "./weather.controller";
import { WeatherService } from "./weather.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UtilModule } from "../util/util.module";
import { SdRoadName } from "src/entities/sdmap/road-name.entity";
import { HdSdRoadLink } from "src/entities/viewer/hd-sd-road-link.entity";
import { RoadService } from "../road/road.service";
import { HttpModule } from "@nestjs/axios";
import { WaterFilmThickness } from "src/entities/weather_risk/water_film_thickness";
import { Wind } from "src/entities/weather_risk/wind";

@Module({
  imports: [TypeOrmModule.forFeature([HdSdRoadLink, SdRoadName, WaterFilmThickness, Wind]), UtilModule, HttpModule],
  controllers: [WeatherController],
  providers: [WeatherService, RoadService],
})
export class WeatherModule {}
