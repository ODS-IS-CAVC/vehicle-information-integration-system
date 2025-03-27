import { createMock } from "@golevelup/ts-jest";
import { Test, TestingModule } from "@nestjs/testing";
import { TransformCoordinatesController } from "../transform-coordinates.controller";
import { TransformCoordinatesService } from "../transform-coordinates.service";
import { plainToInstance } from "class-transformer";
import { VoxelsQueryDTO } from "../dto/voxels-query.dto";
import { LineStringsQueryDTO } from "../dto/line-string-query.dto";
import { BBoxQueryDTO } from "../dto/bbox-query.dto";
import { BadRequestException, InternalServerErrorException, UnprocessableEntityException } from "@nestjs/common";
import { CannotExecuteNotConnectedError } from "typeorm";

describe("TransformCoordinatesController", () => {
  let transformCoordinatesController: TransformCoordinatesController;
  let transformCoordinatesService: TransformCoordinatesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransformCoordinatesController],
      providers: [
        {
          provide: TransformCoordinatesService,
          useValue: createMock<TransformCoordinatesService>(),
        },
      ],
    }).compile();

    transformCoordinatesController = module.get<TransformCoordinatesController>(TransformCoordinatesController);
    transformCoordinatesService = module.get<TransformCoordinatesService>(TransformCoordinatesService);
  });

  it("should be defined", () => {
    expect(transformCoordinatesController).toBeDefined();
  });

  describe("getVoxels", () => {
    let spyGetVoxels: jest.SpyInstance;

    it("queryが『 mesh: 533946 』 の場合にservice.getVoxelsが呼ばれること", async () => {
      const queryDto = plainToInstance(VoxelsQueryDTO, {
        mesh: 533946,
      });

      // 期待値
      const expectedValue = [{ f: 0, x: 29802860, y: 13214669, z: 25 }];

      spyGetVoxels = jest.spyOn(transformCoordinatesService, "getVoxels").mockImplementation(async () => expectedValue);
      await transformCoordinatesController.getVoxels(queryDto);

      // serviceのgetVoxelsが呼ばれることの確認
      expect(spyGetVoxels).toHaveBeenCalledWith(queryDto);
    });

    it("パスパラメータの指定が無い場合、BadRequestExceptionがThrowされること", async () => {
      const queryEmptyDto = plainToInstance(VoxelsQueryDTO, {});

      const spyGetVoxelsBadRequest = jest.spyOn(transformCoordinatesService, "getVoxels").mockImplementation(() => {
        throw new BadRequestException();
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(transformCoordinatesController.getVoxels(queryEmptyDto)).rejects.toThrow(BadRequestException);
      // serviceのgetVoxelsが呼ばれることの確認
      expect(spyGetVoxelsBadRequest).toHaveBeenCalledWith(queryEmptyDto);
    });

    it("指定した行政区画コードが存在しない場合、UnprocessableEntityExceptionがThrowされること", async () => {
      const queryCityDto = plainToInstance(VoxelsQueryDTO, { city: "40000" });

      const spyGetVoxelsUnprocessableEntity = jest.spyOn(transformCoordinatesService, "getVoxels").mockImplementation(() => {
        throw new UnprocessableEntityException();
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(transformCoordinatesController.getVoxels(queryCityDto)).rejects.toThrow(UnprocessableEntityException);
      // serviceのgetVoxelsが呼ばれることの確認
      expect(spyGetVoxelsUnprocessableEntity).toHaveBeenCalledWith(queryCityDto);
    });

    it("DB接続が失敗した場合、InternalServerErrorExceptionがThrowされること", async () => {
      const queryDto = plainToInstance(VoxelsQueryDTO, {
        mesh: 533946,
      });

      const spyGetVoxelsNotConnected = jest.spyOn(transformCoordinatesService, "getVoxels").mockImplementation(() => {
        throw new CannotExecuteNotConnectedError("DB接続エラー");
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(transformCoordinatesController.getVoxels(queryDto)).rejects.toThrow(InternalServerErrorException);
      // serviceのgetVoxelsが呼ばれることの確認
      expect(spyGetVoxelsNotConnected).toHaveBeenCalledWith(queryDto);
    });
  });

  describe("getCoordinates", () => {
    let spyGetCoordinates: jest.SpyInstance;

    it("queryが『 startX: 953518531, startY: 422787405, startZ: 30, startF: 0, endX: 941075056, endY: 426447931, endZ: 30, endF: 0 』 の場合にservice.getCoordinatesが呼ばれること", async () => {
      const queryDto = plainToInstance(LineStringsQueryDTO, {
        startX: 953518531,
        startY: 422787405,
        startZ: 30,
        startF: 0,
        endX: 941075056,
        endY: 426447931,
        endZ: 30,
        endF: 0,
      });

      // 期待値
      const expectedValue = [[{ lon: 139.6920001320541, lat: 35.68900008386581 }], [{ lon: 135.5200000293553, lat: 34.68600001543951 }]];

      spyGetCoordinates = jest.spyOn(transformCoordinatesService, "getLineString").mockImplementation(async () => expectedValue);
      await transformCoordinatesController.getCoordinates(queryDto);

      // serviceのgetLineStringが呼ばれることの確認
      expect(spyGetCoordinates).toHaveBeenCalledWith(queryDto);
    });

    it("パスパラメータの指定が無い場合、BadRequestExceptionがThrowされること", async () => {
      const queryEmptyDto = plainToInstance(LineStringsQueryDTO, {});

      const spyGetLineStringBadRequest = jest.spyOn(transformCoordinatesService, "getLineString").mockImplementation(() => {
        throw new BadRequestException();
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(transformCoordinatesController.getCoordinates(queryEmptyDto)).rejects.toThrow(BadRequestException);
      // serviceのgetLineStringが呼ばれることの確認
      expect(spyGetLineStringBadRequest).toHaveBeenCalledWith(queryEmptyDto);
    });

    it("DB接続が失敗した場合、InternalServerErrorExceptionがThrowされること", async () => {
      const queryDto = plainToInstance(LineStringsQueryDTO, {
        startX: 953518531,
        startY: 422787405,
        startZ: 30,
        startF: 0,
        endX: 941075056,
        endY: 426447931,
        endZ: 30,
        endF: 0,
      });

      const spyGetLineStringNotConnected = jest.spyOn(transformCoordinatesService, "getLineString").mockImplementation(() => {
        throw new CannotExecuteNotConnectedError("DB接続エラー");
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(transformCoordinatesController.getCoordinates(queryDto)).rejects.toThrow(InternalServerErrorException);
      // serviceのgetLineStringが呼ばれることの確認
      expect(spyGetLineStringNotConnected).toHaveBeenCalledWith(queryDto);
    });
  });

  describe("getBBox", () => {
    let spyGetBBox: jest.SpyInstance;

    it("queryが『 mesh: 533946 』 の場合にservice.getBBoxが呼ばれること", async () => {
      const queryDto = plainToInstance(BBoxQueryDTO, {
        mesh: 533946,
      });

      // 期待値
      const expectedValue = [139.75, 35.66666666666667, 139.875, 35.75];

      spyGetBBox = jest.spyOn(transformCoordinatesService, "getBBox").mockImplementation(async () => expectedValue);
      await transformCoordinatesController.getBBox(queryDto);

      // serviceのgetBBoxが呼ばれることの確認
      expect(spyGetBBox).toHaveBeenCalledWith(queryDto);
    });

    it("パスパラメータの指定が無い場合、BadRequestExceptionがThrowされること", async () => {
      const queryEmptyDto = plainToInstance(BBoxQueryDTO, {});

      const spyGetBBoxBadRequest = jest.spyOn(transformCoordinatesService, "getBBox").mockImplementation(() => {
        throw new BadRequestException();
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(transformCoordinatesController.getBBox(queryEmptyDto)).rejects.toThrow(BadRequestException);
      // serviceのgetBBoxが呼ばれることの確認
      expect(spyGetBBoxBadRequest).toHaveBeenCalledWith(queryEmptyDto);
    });

    it("指定した行政区画コードが存在しない場合、UnprocessableEntityExceptionがThrowされること", async () => {
      const queryCityDto = plainToInstance(BBoxQueryDTO, { city: "39000" });

      const spyGetBBoxUnprocessableEntity = jest.spyOn(transformCoordinatesService, "getBBox").mockImplementation(() => {
        throw new UnprocessableEntityException();
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(transformCoordinatesController.getBBox(queryCityDto)).rejects.toThrow(UnprocessableEntityException);
      // serviceのgetBBoxが呼ばれることの確認
      expect(spyGetBBoxUnprocessableEntity).toHaveBeenCalledWith(queryCityDto);
    });

    it("DB接続が失敗した場合、InternalServerErrorExceptionがThrowされること", async () => {
      const queryDto = plainToInstance(BBoxQueryDTO, {
        mesh: 533946,
      });

      const spyGetBBoxNotConnected = jest.spyOn(transformCoordinatesService, "getBBox").mockImplementation(() => {
        throw new CannotExecuteNotConnectedError("DB接続エラー");
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(transformCoordinatesController.getBBox(queryDto)).rejects.toThrow(InternalServerErrorException);
      // serviceのgetBBoxが呼ばれることの確認
      expect(spyGetBBoxNotConnected).toHaveBeenCalledWith(queryDto);
    });
  });
});
