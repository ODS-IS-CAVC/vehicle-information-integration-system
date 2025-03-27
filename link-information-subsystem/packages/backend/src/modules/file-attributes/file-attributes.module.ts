import { Module } from "@nestjs/common";
import { FileAttributesController } from "./file-attributes.controller";
import { FileAttributesService } from "./file-attributes.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UtilModule } from "../util/util.module";
import { Lidar } from "src/entities/pointcloud/lidar.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Lidar]), UtilModule],
  controllers: [FileAttributesController],
  providers: [FileAttributesService],
})
export class FileAttributesModule {}
