import { Module } from "@nestjs/common";
import { PointCloudController } from "./point-cloud.controller";
import { PointCloudService } from "./point-cloud.service";
import { PointCloudSplitManage } from "src/entities/share/point-cloud-split-manage.entity";
import { Users } from "src/entities/share/users.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UtilModule } from "../util/util.module";
import { Lidar } from "src/entities/pointcloud/lidar.entity";
import { LoggerService } from "../util/logger/logger.service";

@Module({
  imports: [TypeOrmModule.forFeature([PointCloudSplitManage, Users, Lidar]), UtilModule],
  controllers: [PointCloudController],
  providers: [PointCloudService, LoggerService],
})
export class PointCloudModule {}
