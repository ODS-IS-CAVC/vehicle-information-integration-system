import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { S3Service } from "src/modules/util/s3.service";
import { CoordinateService } from "src/modules/util/coordinate.service";
import { CannotExecuteNotConnectedError, DataSource } from "typeorm";
import { LoggerService } from "src/modules/util/logger/logger.service";
import { Object3dController } from "../object-3d.controller";
import { Object3dService } from "../object-3d.service";
import { FileValidationPipe } from "../file-validation.pipe";
import { Objects3d } from "src/entities/3d/object-3d.entity";
import { Objects3dOperation } from "src/entities/3d/object-3d-operation.entity";
import { DeleteObjectOperationQueryDto, GetObjectOperationQueryDto } from "../dto/object-3d-query.dto";
import { plainToInstance } from "class-transformer";
import { PutObjectOperationBodyDto, PutObjectOperationTitleBodyDto } from "../dto/object-3d-body.dto";
import { BadRequestException, ConflictException, InternalServerErrorException } from "@nestjs/common";

describe("PointCloudController", () => {
  let controller: Object3dController;
  let service: Object3dService;
  const mockS3Service = jest.mocked(S3Service);
  const mockCoordinateService = jest.mocked(CoordinateService);
  const mockDataSource = jest.mocked(DataSource);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: "postgres",
          host: "database",
          port: 5432,
          username: "postgres",
          password: "postgres",
          database: "postgres",
          autoLoadEntities: true,
        }),
        TypeOrmModule.forFeature([Objects3d, Objects3dOperation]),
      ],
      controllers: [Object3dController],
      providers: [
        Object3dService,
        FileValidationPipe,
        LoggerService,
        {
          provide: S3Service,
          useValue: mockS3Service,
        },
        {
          provide: CoordinateService,
          useValue: mockCoordinateService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    controller = module.get<Object3dController>(Object3dController);
    service = module.get<Object3dService>(Object3dService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe("get3dObjectList", () => {
    it("serviceのget3dObjectList関数が呼び出されること", async () => {
      const result = {
        "3dObjectList": [
          {
            object3dId: 1,
            fileName: "fileName",
            url: "",
          },
        ],
      };
      const spyGet3dObjectList = jest.spyOn(service, "get3dObjectList").mockReturnValue(Promise.resolve(result));
      await controller.get3dObjectList();
      expect(spyGet3dObjectList).toHaveBeenCalled();
    });

    it("DB接続が失敗した場合はInternalServerErrorExceptionがThrowされること", async () => {
      const spyGet3dObjectListNotConnected = jest.spyOn(service, "get3dObjectList").mockImplementation(() => {
        throw new CannotExecuteNotConnectedError("DB接続エラー");
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.get3dObjectList()).rejects.toThrow(InternalServerErrorException);
      // serviceのget3dObjectListが呼ばれることの確認
      expect(spyGet3dObjectListNotConnected).toHaveBeenCalled();
    });
  });

  describe("get3dObjectUpUrl", () => {
    it("serviceのget3dObjectUpUrl関数が呼び出されること", async () => {
      const result = {
        url: "",
      };
      const fileName: any = {
        filename: "test111.obj",
      };
      const spyGet3dObjectUpUrl = jest.spyOn(service, "get3dObjectUpUrl").mockReturnValue(Promise.resolve(result));
      await controller.get3dObjectUpUrl(fileName);
      expect(spyGet3dObjectUpUrl).toHaveBeenCalled();
    });

    it("同名の3Dオブジェクトが存在する場合はConflictExceptionがThrowされること", async () => {
      const fileName: any = {
        filename: "test111.obj",
      };

      const spyGet3dObjectUpUrlConflict = jest.spyOn(service, "get3dObjectUpUrl").mockImplementation(() => {
        throw new ConflictException();
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.get3dObjectUpUrl(fileName)).rejects.toThrow(ConflictException);
      // serviceのget3dObjectUpUrlが呼ばれることの確認
      expect(spyGet3dObjectUpUrlConflict).toHaveBeenCalledWith(fileName.filename);
    });

    it("ファイル名の拡張子がglbまたはobjで無い場合はBadRequestExceptionがThrowされること", async () => {
      const fileName: any = {
        filename: "test111",
      };

      const spyGet3dObjectUpUrlBadRequest = jest.spyOn(service, "get3dObjectUpUrl").mockImplementation(() => {
        throw new BadRequestException();
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.get3dObjectUpUrl(fileName)).rejects.toThrow(BadRequestException);
      // serviceのget3dObjectUpUrlが呼ばれることの確認
      expect(spyGet3dObjectUpUrlBadRequest).toHaveBeenCalledWith(fileName.filename);
    });

    it("DB接続が失敗した場合はInternalServerErrorExceptionがThrowされること", async () => {
      const fileName: any = {
        filename: "test111.obj",
      };

      const spyGet3dObjectUpUrlNotConnected = jest.spyOn(service, "get3dObjectUpUrl").mockImplementation(() => {
        throw new CannotExecuteNotConnectedError("DB接続エラー");
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.get3dObjectUpUrl(fileName)).rejects.toThrow(InternalServerErrorException);
      // serviceのget3dObjectUpUrlが呼ばれることの確認
      expect(spyGet3dObjectUpUrlNotConnected).toHaveBeenCalledWith(fileName.filename);
    });
  });

  describe("getObjectOperationList", () => {
    it("serviceのgetObjectOperationList関数が呼び出されること", async () => {
      const queryDto = plainToInstance(GetObjectOperationQueryDto, {
        pointCloudUniqueId: 1,
      });
      const result: any = {
        result: "",
      };
      const spyGetObjectOperationList = jest.spyOn(service, "getObjectOperationList").mockReturnValue(Promise.resolve(result));
      await controller.getObjectOperationList(queryDto);
      expect(spyGetObjectOperationList).toHaveBeenCalledWith(queryDto);
    });

    it("DB接続が失敗した場合はInternalServerErrorExceptionがThrowされること", async () => {
      const queryDto = plainToInstance(GetObjectOperationQueryDto, {
        pointCloudUniqueId: 1,
      });

      const spyGetObjectOperationListNotConnected = jest.spyOn(service, "getObjectOperationList").mockImplementation(() => {
        throw new CannotExecuteNotConnectedError("DB接続エラー");
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.getObjectOperationList(queryDto)).rejects.toThrow(InternalServerErrorException);
      // serviceのgetObjectOperationListが呼ばれることの確認
      expect(spyGetObjectOperationListNotConnected).toHaveBeenCalledWith(queryDto);
    });
  });

  describe("put3dOperation", () => {
    it("serviceのput3dOperation関数が呼び出されること", async () => {
      const queryDto = plainToInstance(PutObjectOperationBodyDto, {
        operationId: 1,
        pointCloudUniqueId: 1,
        object3dId: 1,
        title: "title",
        putCoordinates: [0, 0, 0],
        xRotation: 0,
        yRotation: 0,
        zRotation: 0,
        scale: 0,
      });
      const result: any = {
        result: "",
      };
      const spyPut3dOperation = jest.spyOn(service, "put3dOperation").mockReturnValue(Promise.resolve(result));
      await controller.put3dOperation(queryDto);
      expect(spyPut3dOperation).toHaveBeenCalledWith(queryDto);
    });

    it("同名の3Dオブジェクトが存在する場合はConflictExceptionがThrowされること", async () => {
      const queryDto = plainToInstance(PutObjectOperationBodyDto, {
        operationId: 1,
        pointCloudUniqueId: 1,
        object3dId: 1,
        title: "title",
        putCoordinates: [0, 0, 0],
        xRotation: 0,
        yRotation: 0,
        zRotation: 0,
        scale: 0,
      });

      const spyPut3dOperationConflict = jest.spyOn(service, "put3dOperation").mockImplementation(() => {
        throw new ConflictException();
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.put3dOperation(queryDto)).rejects.toThrow(ConflictException);
      // serviceのput3dOperationが呼ばれることの確認
      expect(spyPut3dOperationConflict).toHaveBeenCalledWith(queryDto);
    });

    it("DB接続が失敗した場合はInternalServerErrorExceptionがThrowされること", async () => {
      const queryDto = plainToInstance(PutObjectOperationBodyDto, {
        operationId: 1,
        pointCloudUniqueId: 1,
        object3dId: 1,
        title: "title",
        putCoordinates: [0, 0, 0],
        xRotation: 0,
        yRotation: 0,
        zRotation: 0,
        scale: 0,
      });

      const spyPut3dOperationNotConnected = jest.spyOn(service, "put3dOperation").mockImplementation(() => {
        throw new CannotExecuteNotConnectedError("DB接続エラー");
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.put3dOperation(queryDto)).rejects.toThrow(InternalServerErrorException);
      // serviceのput3dOperationが呼ばれることの確認
      expect(spyPut3dOperationNotConnected).toHaveBeenCalledWith(queryDto);
    });
  });

  describe("put3dOperationTitle", () => {
    it("serviceのput3dOperationTitle関数が呼び出されること", async () => {
      const queryDto = plainToInstance(PutObjectOperationTitleBodyDto, {
        operationId: 1,
        title: "title",
      });
      const result: any = {
        result: "",
      };
      const spyPut3dOperationTitle = jest.spyOn(service, "put3dOperationTitle").mockReturnValue(Promise.resolve(result));
      await controller.put3dOperationTitle(queryDto);
      expect(spyPut3dOperationTitle).toHaveBeenCalledWith(queryDto);
    });

    it("同名の3Dオブジェクトが存在する場合はConflictExceptionがThrowされること", async () => {
      const queryDto = plainToInstance(PutObjectOperationTitleBodyDto, {
        operationId: 1,
        title: "title",
      });

      const spyPut3dOperationTitleConflict = jest.spyOn(service, "put3dOperationTitle").mockImplementation(() => {
        throw new ConflictException();
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.put3dOperationTitle(queryDto)).rejects.toThrow(ConflictException);
      // serviceのput3dOperationTitleが呼ばれることの確認
      expect(spyPut3dOperationTitleConflict).toHaveBeenCalledWith(queryDto);
    });

    it("DB接続が失敗した場合はInternalServerErrorExceptionがThrowされること", async () => {
      const queryDto = plainToInstance(PutObjectOperationTitleBodyDto, {
        operationId: 1,
        title: "title",
      });

      const spyPut3dOperationTitleNotConnected = jest.spyOn(service, "put3dOperationTitle").mockImplementation(() => {
        throw new CannotExecuteNotConnectedError("DB接続エラー");
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.put3dOperationTitle(queryDto)).rejects.toThrow(InternalServerErrorException);
      // serviceのput3dOperationTitleが呼ばれることの確認
      expect(spyPut3dOperationTitleNotConnected).toHaveBeenCalledWith(queryDto);
    });
  });

  describe("delete3dOperation", () => {
    it("serviceのdelete3dOperation関数が呼び出されること", async () => {
      const queryDto = plainToInstance(DeleteObjectOperationQueryDto, {
        operationId: 1,
      });
      const result: any = {
        result: "",
      };
      const spyDelete3dOperation = jest.spyOn(service, "delete3dOperation").mockReturnValue(Promise.resolve(result));
      await controller.delete3dOperation(queryDto);
      expect(spyDelete3dOperation).toHaveBeenCalledWith(queryDto);
    });

    it("DB接続が失敗した場合はInternalServerErrorExceptionがThrowされること", async () => {
      const queryDto = plainToInstance(DeleteObjectOperationQueryDto, {
        operationId: 1,
      });

      const spyDelete3dOperationNotConnected = jest.spyOn(service, "delete3dOperation").mockImplementation(() => {
        throw new CannotExecuteNotConnectedError("DB接続エラー");
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.delete3dOperation(queryDto)).rejects.toThrow(InternalServerErrorException);
      // serviceのdelete3dOperationが呼ばれることの確認
      expect(spyDelete3dOperationNotConnected).toHaveBeenCalledWith(queryDto);
    });
  });
});
