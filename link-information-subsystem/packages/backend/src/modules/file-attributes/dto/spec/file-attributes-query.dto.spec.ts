import { plainToInstance } from "class-transformer";
import { GetFileAttributesQueryDto } from "../file-attributes-query.dto";
import { validate } from "class-validator";

describe("GetFileAttributesQueryDto", () => {
  it("fileNameが『PNT_1119_202207281205_S09_01.laz』の場合にバリデーションチェックが成功すること", async () => {
    const dto = plainToInstance(GetFileAttributesQueryDto, {
      fileName: "PNT_1119_202207281205_S09_01.laz",
    });

    // アサーションの呼び出し確認
    expect.assertions(1);
    // 実行して成功することを確認
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it("fileNameが空文字の場合にバリデーションチェックが失敗すること", async () => {
    const dto = plainToInstance(GetFileAttributesQueryDto, {
      fileName: "",
    });

    // アサーションの呼び出し確認
    expect.assertions(1);
    // 実行して失敗することを確認
    const errors = await validate(dto);
    expect(errors.length).toBe(1);
  });

  it("fileNameが存在しない場合にバリデーションチェックが失敗すること", async () => {
    const dto = plainToInstance(GetFileAttributesQueryDto, {});

    // アサーションの呼び出し確認
    expect.assertions(1);
    // 実行して失敗することを確認
    const errors = await validate(dto);
    expect(errors.length).toBe(1);
  });
});
