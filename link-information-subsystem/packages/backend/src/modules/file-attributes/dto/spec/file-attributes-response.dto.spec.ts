import { plainToInstance } from "class-transformer";
import { GetResultFileAttributesResponseDto } from "../file-attributes-response.dto";

describe("GetResultFileAttributesResponseDto", () => {
  it("GetResultFileAttributesResponseDtoのインスタンスを作成した時にプロパティが正しく設定されていること", () => {
    const getResultFileAttributesResponseDto = plainToInstance(GetResultFileAttributesResponseDto, {
      dataModelType: "test1",
      attribute: {
        fileName: "PNT_1119_202207281205_S09_01.laz",
        type: "potree",
        size: 361170789,
        created: "2024-10-30T15:42:00.000Z",
        coordinates: "01050000A0291A000001",
      },
    });

    // プロパティが正しく設定されているか確認
    expect(getResultFileAttributesResponseDto.dataModelType).toBe("test1");
    expect(getResultFileAttributesResponseDto.attribute.fileName).toBe("PNT_1119_202207281205_S09_01.laz");
    expect(getResultFileAttributesResponseDto.attribute.type).toBe("potree");
    expect(getResultFileAttributesResponseDto.attribute.size).toBe(361170789);
    expect(getResultFileAttributesResponseDto.attribute.created).toBe("2024-10-30T15:42:00.000Z");
    expect(getResultFileAttributesResponseDto.attribute.coordinates).toBe("01050000A0291A000001");
  });
});
