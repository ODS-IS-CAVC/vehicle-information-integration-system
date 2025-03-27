import { Test, TestingModule } from "@nestjs/testing";
import { FacadeController } from "../facade.controller";
import { FacadeService } from "../facade.service";
import { FACADE_URL } from "src/consts/facade.const";

describe("FacadeController", () => {
  let facadeController: FacadeController;
  let facadeService: FacadeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FacadeController],
      providers: [FacadeService],
    }).compile();

    facadeController = module.get<FacadeController>(FacadeController);
    facadeService = module.get<FacadeService>(FacadeService);
  });

  it("should be defined", () => {
    expect(facadeController).toBeDefined();
  });

  describe("facade", () => {
    let spyFacade: jest.SpyInstance;

    it("service.facadeが呼ばれること", async () => {
      // 期待値
      const expectedValue = {
        dataModelType: "test1",
        attribute: {
          url: FACADE_URL(),
        },
      };

      spyFacade = jest.spyOn(facadeService, "facade").mockReturnValue(expectedValue);
      facadeController.facade();

      // serviceのfacadeが呼ばれることの確認
      expect(spyFacade).toHaveBeenCalled();
    });
  });
});
