import { MiddlewareConsumer, Module, NestModule, RequestMethod } from "@nestjs/common";
import { TypeOrmModule, TypeOrmModuleAsyncOptions } from "@nestjs/typeorm";
import { config } from "dotenv";
import { Object3dModule } from "./modules/object-3d/object-3d.module";
import { RoadModule } from "./modules/road/road.module";
import { ResourcesModule } from "./modules/resources/resources.module";
import { TransformCoordinatesModule } from "./modules/transform-coordinates/transform-coordinates.module";
import { UtilModule } from "./modules/util/util.module";
import { PointCloudModule } from "./modules/point-cloud/point-cloud.module";
import { AuthModule } from "./modules/auth/auth.module";
import { SharesModule } from "./modules/shares/shares.module";
import { UserModule } from "./modules/user/user.module";
import { CurrentUserMiddleware } from "./modules/_middleware/current-user.middleware";
import { FileAttributesModule } from "./modules/file-attributes/file-attributes.module";
import { FacadeModule } from "./modules/facade/facade.module";
import { WeatherModule } from "./modules/weather/weather.module";
import { ConfigService } from "./config/config.service";

config({ path: ".env" });

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      extraProviders: [ConfigService],
      useFactory: async (config: ConfigService) => (await config.databaseConfig()) as TypeOrmModuleAsyncOptions,
    }),
    Object3dModule,
    RoadModule,
    ResourcesModule,
    TransformCoordinatesModule,
    UtilModule,
    PointCloudModule,
    AuthModule,
    SharesModule,
    UserModule,
    FileAttributesModule,
    FacadeModule,
    WeatherModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CurrentUserMiddleware).forRoutes({ path: "*", method: RequestMethod.ALL });
  }
}
