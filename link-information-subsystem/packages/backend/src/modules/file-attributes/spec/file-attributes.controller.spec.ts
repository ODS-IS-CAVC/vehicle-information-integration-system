import { Test, TestingModule } from "@nestjs/testing";
import { FileAttributesController } from "../file-attributes.controller";
import { FileAttributesService } from "../file-attributes.service";
import { createMock } from "@golevelup/ts-jest";
import { plainToInstance } from "class-transformer";
import { GetFileAttributesQueryDto } from "../dto/file-attributes-query.dto";
import { InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { CannotExecuteNotConnectedError } from "typeorm";

describe("FileAttributesController", () => {
  let fileAttributesController: FileAttributesController;
  let fileAttributesService: FileAttributesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FileAttributesController],
      providers: [
        {
          provide: FileAttributesService,
          useValue: createMock<FileAttributesService>(),
        },
      ],
    }).compile();

    fileAttributesController = module.get<FileAttributesController>(FileAttributesController);
    fileAttributesService = module.get<FileAttributesService>(FileAttributesService);
  });

  it("should be defined", () => {
    expect(fileAttributesController).toBeDefined();
  });

  describe("getFileAttributes", () => {
    let spyGetFileAttributes: jest.SpyInstance;

    it("queryが『 { fileName: 'PNT_1119_202207281205_S03_02.laz' } 』 の場合にservice.getFileAttributesが呼ばれること", async () => {
      const queryDto = plainToInstance(GetFileAttributesQueryDto, {
        fileName: "PNT_1119_202207281205_S03_02.laz",
      });

      // 期待値　※coordinatesは桁数が多いため、最初の50桁のみ
      const expectedValue = {
        dataModelType: "test1",
        attribute: {
          fileName: "PNT_1119_202207281205_S03_02.laz",
          type: "laz",
          size: 117780006,
          created: new Date("2024-12-19T15:42:00.000Z"),
          coordinates: "01050000A0291A000001000000010200008037000000CA6BF5",
        },
      };

      spyGetFileAttributes = jest.spyOn(fileAttributesService, "getFileAttributes").mockImplementation(async () => expectedValue);
      await fileAttributesController.getFileAttributes(queryDto);

      // serviceのgetFileAttributesが呼ばれることの確認
      expect(spyGetFileAttributes).toHaveBeenCalledWith(queryDto);
    });

    it("リクエストしたファイルに一致するデータがlidarテーブルに無い場合はNotFoundExceptionがThrowされること", async () => {
      const queryDto = plainToInstance(GetFileAttributesQueryDto, {
        fileName: "PNT_1117_202206170814_S10_02.laz",
      });

      spyGetFileAttributes = jest.spyOn(fileAttributesService, "getFileAttributes").mockImplementation(() => {
        throw new NotFoundException();
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(fileAttributesController.getFileAttributes(queryDto)).rejects.toThrow(NotFoundException);
      // serviceのgetFileAttributesが呼ばれることの確認
      expect(spyGetFileAttributes).toHaveBeenCalledWith(queryDto);
    });

    it("リクエストしたファイルに一致するファイルがS3に存在しない場合はNotFoundExceptionがThrowされること", async () => {
      const queryDto = plainToInstance(GetFileAttributesQueryDto, {
        fileName: "test.las",
      });

      spyGetFileAttributes = jest.spyOn(fileAttributesService, "getFileAttributes").mockImplementation(() => {
        throw new NotFoundException();
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(fileAttributesController.getFileAttributes(queryDto)).rejects.toThrow(NotFoundException);
      // serviceのgetFileAttributesが呼ばれることの確認
      expect(spyGetFileAttributes).toHaveBeenCalledWith(queryDto);
    });

    it("DB接続が失敗した場合はInternalServerErrorExceptionがThrowされること", async () => {
      const queryDto = plainToInstance(GetFileAttributesQueryDto, {
        fileName: "PNT_1119_202207281205_S09_01.laz",
      });

      spyGetFileAttributes = jest.spyOn(fileAttributesService, "getFileAttributes").mockImplementation(() => {
        throw new CannotExecuteNotConnectedError("DB接続エラー");
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(fileAttributesController.getFileAttributes(queryDto)).rejects.toThrow(InternalServerErrorException);
      // serviceのgetFileAttributesが呼ばれることの確認
      expect(spyGetFileAttributes).toHaveBeenCalledWith(queryDto);
    });
  });
});
