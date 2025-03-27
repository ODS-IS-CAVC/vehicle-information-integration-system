import { Module } from "@nestjs/common";
import { TransformCoordinatesController } from "./transform-coordinates.controller";
import { TransformCoordinatesService } from "./transform-coordinates.service";
import { UtilModule } from "../util/util.module";
@Module({
  imports: [UtilModule],
  controllers: [TransformCoordinatesController],
  providers: [TransformCoordinatesService],
})
export class TransformCoordinatesModule {}
