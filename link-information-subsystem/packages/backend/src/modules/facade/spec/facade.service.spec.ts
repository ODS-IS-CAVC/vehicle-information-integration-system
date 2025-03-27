import { Test, TestingModule } from "@nestjs/testing";
import { FacadeService } from "../facade.service";
import { FACADE_URL } from "../../../../test/jest.const";

describe("FacadeService", () => {
  let facadeService: FacadeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FacadeService],
    }).compile();

    facadeService = module.get<FacadeService>(FacadeService);
  });

  it("should be defined", () => {
    expect(facadeService).toBeDefined();
  });

  describe("facade", () => {
    it("facadeを呼び出した場合に『{ dataModelType: 'test1', attribute: { url: FACADE_URL() }}』が返却される", () => {
      // 期待値
      const expectedValue = {
        dataModelType: "test1",
        attribute: {
          url: FACADE_URL(),
        },
      };

      // 実行して結果を比較
      const result = facadeService.facade();
      expect(result).toEqual(expectedValue);
    });
  });
});
