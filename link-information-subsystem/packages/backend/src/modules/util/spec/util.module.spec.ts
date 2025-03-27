import { Test, TestingModule } from "@nestjs/testing";
import { UtilModule } from "../util.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CoordinateService } from "../coordinate.service";
import { ShapefileService } from "../shapefile.service";
import { SchemaRelationService } from "../schema-relation.service";
import { CodeNameService } from "../code-name.service";
import { S3Service } from "../s3.service";
import { SnsNotificationService } from "../sns-notification.service";
import { LoggerService } from "../logger/logger.service";
import { DateFormatService } from "../date-format.service";

describe("UtilModule", () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        UtilModule,
        TypeOrmModule.forRoot({
          type: "postgres",
          host: "10.71.80.38",
          port: 15432,
          username: "postgres",
          password: "postgres",
          database: "DMDB",
          autoLoadEntities: true,
        }),
      ],
      controllers: [],
      providers: [],
    }).compile();
  });

  afterEach(async () => {
    await module.close();
  });

  it("UtilModuleが正常にインスタンス化されていること", () => {
    expect(module).toBeDefined();
    // serviceのインスタンスがあることを確認
    expect(module.get(CoordinateService)).toBeInstanceOf(CoordinateService);
    expect(module.get(ShapefileService)).toBeInstanceOf(ShapefileService);
    expect(module.get(SchemaRelationService)).toBeInstanceOf(SchemaRelationService);
    expect(module.get(CodeNameService)).toBeInstanceOf(CodeNameService);
    expect(module.get(S3Service)).toBeInstanceOf(S3Service);
    expect(module.get(SnsNotificationService)).toBeInstanceOf(SnsNotificationService);
    expect(module.get(LoggerService)).toBeInstanceOf(LoggerService);
    expect(module.get(DateFormatService)).toBeInstanceOf(DateFormatService);
  });
});
