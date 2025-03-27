import { Test, TestingModule } from "@nestjs/testing";
import { FileAttributesModule } from "../file-attributes.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FileAttributesController } from "../file-attributes.controller";
import { FileAttributesService } from "../file-attributes.service";

describe("FileAttributesModule", () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        FileAttributesModule,
        TypeOrmModule.forRoot({
          type: "postgres",
          host: "database",
          port: 5432,
          username: "postgres",
          password: "postgres",
          database: "postgres",
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

  it("FileAttributesModuleが正常にインスタンス化されていること", () => {
    expect(module).toBeDefined();
    // controllerのインスタンスがあることを確認
    expect(module.get(FileAttributesController)).toBeInstanceOf(FileAttributesController);
    // serviceのインスタンスがあることを確認
    expect(module.get(FileAttributesService)).toBeInstanceOf(FileAttributesService);
  });
});
