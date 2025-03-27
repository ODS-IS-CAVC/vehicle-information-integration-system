import { Test, TestingModule } from "@nestjs/testing";
import { ResourcesModule } from "../resources.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ResourcesController } from "../resources.controller";
import { ResourcesService } from "../resources.service";

describe("ResourcesModule", () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        ResourcesModule,
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

  it("ResourcesModuleが正常にインスタンス化されていること", () => {
    expect(module).toBeDefined();
    expect(module.get(ResourcesController)).toBeInstanceOf(ResourcesController);
    expect(module.get(ResourcesService)).toBeInstanceOf(ResourcesService);
  });
});
