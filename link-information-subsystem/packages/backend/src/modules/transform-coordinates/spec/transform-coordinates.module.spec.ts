import { Test, TestingModule } from "@nestjs/testing";
import { TransformCoordinatesModule } from "../transform-coordinates.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TransformCoordinatesController } from "../transform-coordinates.controller";
import { TransformCoordinatesService } from "../transform-coordinates.service";

describe("TransformCoordinatesModule", () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        TransformCoordinatesModule,
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

  it("TransformCoordinatesModuleが正常にインスタンス化されていること", () => {
    expect(module).toBeDefined();
    // controllerのインスタンスがあることを確認
    expect(module.get(TransformCoordinatesController)).toBeInstanceOf(TransformCoordinatesController);
    // serviceのインスタンスがあることを確認
    expect(module.get(TransformCoordinatesService)).toBeInstanceOf(TransformCoordinatesService);
  });
});
