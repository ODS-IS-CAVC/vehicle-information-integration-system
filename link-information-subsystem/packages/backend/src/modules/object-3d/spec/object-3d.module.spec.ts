import { Test, TestingModule } from "@nestjs/testing";
import { LoggerService } from "src/modules/util/logger/logger.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Objects3d } from "src/entities/3d/object-3d.entity";
import { Objects3dOperation } from "src/entities/3d/object-3d-operation.entity";
import { Object3dModule } from "../object-3d.module";
import { Object3dController } from "../object-3d.controller";
import { Object3dService } from "../object-3d.service";
import { FileValidationPipe } from "../file-validation.pipe";

describe("PointCloudModule", () => {
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
        TypeOrmModule.forFeature([Objects3d, Objects3dOperation]),
        Object3dModule,
      ],
    }).compile();
  });

  it("should compile the module", async () => {
    expect(module).toBeDefined();
    expect(module.get(Object3dController)).toBeInstanceOf(Object3dController);
    expect(module.get(Object3dService)).toBeInstanceOf(Object3dService);
    expect(module.get(LoggerService)).toBeInstanceOf(LoggerService);
    expect(module.get(FileValidationPipe)).toBeInstanceOf(FileValidationPipe);
  });
});
