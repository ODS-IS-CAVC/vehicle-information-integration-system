import { Module } from "@nestjs/common";
import { ResourcesController } from "./resources.controller";
import { ResourcesService } from "./resources.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SharedResources } from "src/entities/share/shared-resources.entity";
import { UtilModule } from "../util/util.module";

@Module({
  imports: [TypeOrmModule.forFeature([SharedResources]), UtilModule],
  controllers: [ResourcesController],
  providers: [ResourcesService],
  exports: [ResourcesService],
})
export class ResourcesModule {}
