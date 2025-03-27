import { Module } from "@nestjs/common";
import { Object3dController } from "./object-3d.controller";
import { Object3dService } from "./object-3d.service";
import { Objects3d } from "src/entities/3d/object-3d.entity";
import { Objects3dOperation } from "src/entities/3d/object-3d-operation.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UtilModule } from "../util/util.module";
import { FileValidationPipe } from "./file-validation.pipe";

@Module({
  imports: [TypeOrmModule.forFeature([Objects3d, Objects3dOperation]), UtilModule],
  controllers: [Object3dController],
  providers: [Object3dService, FileValidationPipe],
})
export class Object3dModule {}
