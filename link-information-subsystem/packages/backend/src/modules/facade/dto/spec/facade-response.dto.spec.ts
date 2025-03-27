import { plainToInstance } from "class-transformer";
import { FacadeResponseDto } from "../facade-response.dto";
import { FACADE_URL } from "src/consts/facade.const";

describe("FacadeResponseDto", () => {
  it("FacadeResponseDtoのインスタンスを作成した時にプロパティが正しく設定されていること", () => {
    const facadeResponseDto = plainToInstance(FacadeResponseDto, {
      dataModelType: "test1",
      attribute: {
        url: FACADE_URL(),
      },
    });

    // プロパティが正しく設定されているか確認
    expect(facadeResponseDto.dataModelType).toBe("test1");
    expect(facadeResponseDto.attribute.url).toBe(FACADE_URL());
  });
});
