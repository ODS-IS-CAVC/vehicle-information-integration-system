import { Test, TestingModule } from "@nestjs/testing";
import { FacadeModule } from "../facade.module";
import { FacadeController } from "../facade.controller";
import { FacadeService } from "../facade.service";

describe("FacadeModule", () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [FacadeModule],
      controllers: [],
      providers: [],
    }).compile();
  });

  it("FacadeModuleが正常にインスタンス化されていること", () => {
    expect(module).toBeDefined();
    // controllerのインスタンスがあることを確認
    expect(module.get(FacadeController)).toBeInstanceOf(FacadeController);
    // serviceのインスタンスがあることを確認
    expect(module.get(FacadeService)).toBeInstanceOf(FacadeService);
  });
});
