import { Test, TestingModule } from "@nestjs/testing";
import { PointCloudService } from "../point-cloud.service";
import { PointCloudController } from "../point-cloud.controller";
import { LoggerService } from "src/modules/util/logger/logger.service";
import { PointCloudModule } from "../point-cloud.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Lidar } from "src/entities/pointcloud/lidar.entity";
import { PointCloudSplitManage } from "src/entities/share/point-cloud-split-manage.entity";
import { Users } from "src/entities/share/users.entity";

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
        TypeOrmModule.forFeature([Lidar, PointCloudSplitManage, Users]),
        PointCloudModule,
      ],
    }).compile();
  });

  afterEach(async () => {
    await module.close();
  });

  it("should compile the module", async () => {
    expect(module).toBeDefined();
    expect(module.get(PointCloudController)).toBeInstanceOf(PointCloudController);
    expect(module.get(PointCloudService)).toBeInstanceOf(PointCloudService);
    expect(module.get(LoggerService)).toBeInstanceOf(LoggerService);
  });
});
