import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Object3dController } from "../object-3d.controller";
import { Object3dService } from "../object-3d.service";
import { FileValidationPipe } from "../file-validation.pipe";
import { Objects3d } from "src/entities/3d/object-3d.entity";
import { Objects3dOperation } from "src/entities/3d/object-3d-operation.entity";
import { UtilModule } from "src/modules/util/util.module";
import { S3Service } from "src/modules/util/s3.service";
import { BadRequestException, ConflictException } from "@nestjs/common";
import { createDb, resetDb } from "./3d-db-reset/db-reset";
import { plainToInstance } from "class-transformer";
import { DeleteObjectOperationQueryDto, GetObjectOperationQueryDto } from "../dto/object-3d-query.dto";
import { PutObjectOperationBodyDto, PutObjectOperationTitleBodyDto } from "../dto/object-3d-body.dto";

describe("Object3dService", () => {
  let service: Object3dService;
  let s3Service: S3Service;

  beforeAll(async () => {
    //await createDb();
    await resetDb();
  });

  afterAll(async () => {
    await resetDb();
  });

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
        UtilModule,
      ],
      controllers: [Object3dController],
      providers: [Object3dService, FileValidationPipe],
    }).compile();

    service = module.get<Object3dService>(Object3dService);
    s3Service = module.get<S3Service>(S3Service);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("get3dObjectList データなしの場合", () => {
    it("登録済みの3Dオブジェクトが存在しない場合、空配列が返されること", async () => {
      jest.spyOn(s3Service, "createPresignedUrlWithClient").mockReturnValue(Promise.resolve("https://test.co.jp"));
      const result = await service.get3dObjectList();
      expect(result).toEqual({ "3dObjectList": [] });
    });
  });

  describe("get3dObjectUpUrl", () => {
    it("同名の3Dオブジェクトが存在しない場合、正常にURL取得が完了すること", async () => {
      const spyValue: any = "unittest_file.obj";
      jest.spyOn(s3Service, "uploadPresignedUrlWithClient").mockReturnValue(spyValue);
      const result = await service.get3dObjectUpUrl("unittest_file.obj");
      expect(result.url).not.toBe("");
    });

    it("ファイル名の拡張子がglbまたはobjで無い場合、400: BadRequestが返却されること", async () => {
      await expect(service.get3dObjectUpUrl("unittest_file")).rejects.toThrow(BadRequestException);
    });

    it("同名の3Dオブジェクトが存在する場合、409: Conflictが返却されること", async () => {
      await expect(service.get3dObjectUpUrl("unittest_file.obj")).rejects.toThrow(ConflictException);
    });
  });

  describe("get3dObjectList データありの場合", () => {
    it("登録済みの3Dオブジェクトが存在する場合、リストが返却されること", async () => {
      jest.spyOn(s3Service, "createPresignedUrlWithClient").mockReturnValue(Promise.resolve("https://test.co.jp"));
      const result = await service.get3dObjectList();
      expect(result["3dObjectList"].length).not.toBe(0);
    });
  });

  describe("getObjectOperationList", () => {
    it("リクエスト内容の点群IDに該当する操作結果が存在しない場合、空配列が返却されること", async () => {
      const queryDto = plainToInstance(GetObjectOperationQueryDto, {
        pointCloudUniqueId: -1,
      });
      const result = await service.getObjectOperationList(queryDto);
      expect(result).toEqual({ operationList: [] });
    });

    it("登録済みの3Dオブジェクト操作結果が存在する場合、操作結果のリストが返却されること", async () => {
      await createDb();
      const queryDto = plainToInstance(GetObjectOperationQueryDto, {
        pointCloudUniqueId: 1,
      });
      jest.spyOn(s3Service, "createPresignedUrlWithClient").mockReturnValue(Promise.resolve("https://test.co.jp"));
      const result = await service.getObjectOperationList(queryDto);
      expect(result.operationList.length).not.toBe(0);
    });
  });

  describe("put3dOperationTitle", () => {
    it("登録済みの3Dオブジェクト操作結果が存在する場合、操作結果のタイトルが変更されること", async () => {
      const queryDto = plainToInstance(PutObjectOperationTitleBodyDto, {
        operationId: 0,
        title: "unittest_update_title",
      });
      const result = await service.put3dOperationTitle(queryDto);
      expect(result.result).toBe("SUCCESS");
    });

    it("同名の3Dオブジェクト操作結果が存在する場合、409: Conflictが返却されること", async () => {
      const queryDto = plainToInstance(PutObjectOperationTitleBodyDto, {
        operationId: 0,
        title: "unittest_update_title",
      });
      await expect(service.put3dOperationTitle(queryDto)).rejects.toThrow(ConflictException);
    });
  });

  describe("delete3dOperation", () => {
    it("登録済みの3Dオブジェクト操作結果が存在する場合、操作結果が削除されること", async () => {
      const queryDto = plainToInstance(DeleteObjectOperationQueryDto, {
        operationId: 0,
      });
      const result = await service.delete3dOperation(queryDto);
      expect(result.result).toBe("SUCCESS");
    });
  });

  //put3dOperation
  describe("put3dOperation", () => {
    it("3Dオブジェクト操作結果の新規登録、操作結果が登録されること。また操作IDが存在する場合、操作結果が更新されること。", async () => {
      const queryDto = plainToInstance(PutObjectOperationBodyDto, {
        // operationId: 0,
        title: "unittest_title",
        pointCloudUniqueId: 1,
        object3dId: 0,
        putCoordinates: [10.123456789, 10.123456789, 10.123456789],
        xRotation: 10.123456789,
        yRotation: 10.123456789,
        zRotation: 10.123456789,
        scale: 10.123456789,
      });
      const result: any = await service.put3dOperation(queryDto);
      expect(result).not.toBe("");

      const queryDto2 = plainToInstance(PutObjectOperationBodyDto, {
        operationId: result.operationId,
        title: "update_test_title",
        pointCloudUniqueId: 1,
        object3dId: 0,
        putCoordinates: [10.123456789, 10.123456789, 10.123456789],
        xRotation: 10.123456789,
        yRotation: 10.123456789,
        zRotation: 10.123456789,
        scale: 10.123456789,
      });
      const result2: any = await service.put3dOperation(queryDto2);
      expect(result2).not.toBe("");
    });

    it("3Dオブジェクト操作結果の新規登録、タイトルが登録済みの場合、409: Conflictが返却されること", async () => {
      const queryDto = plainToInstance(PutObjectOperationBodyDto, {
        title: "update_test_title",
        pointCloudUniqueId: 1,
        object3dId: 0,
        putCoordinates: [10.123456789, 10.123456789, 10.123456789],
        xRotation: 10.123456789,
        yRotation: 10.123456789,
        zRotation: 10.123456789,
        scale: 10.123456789,
      });
      await expect(service.put3dOperation(queryDto)).rejects.toThrow(ConflictException);
    });
  });
});
