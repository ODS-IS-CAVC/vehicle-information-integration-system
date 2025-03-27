import { createMock } from "@golevelup/ts-jest";
import { Test, TestingModule } from "@nestjs/testing";
import { plainToInstance } from "class-transformer";
import { ResourcesService } from "../resources.service";
import { ResourcesController } from "../resources.controller";
import { SharedResourcesPutBodyDTO } from "../dto/resources-put-body.dto";
import { SharedResourcesDeleteBodyDTO } from "../dto/resources-delete-body.dto";
import { InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { CannotExecuteNotConnectedError } from "typeorm";

describe("ResourcesController", () => {
  let controller: ResourcesController;
  let service: ResourcesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResourcesController],
      providers: [{ provide: ResourcesService, useValue: createMock<ResourcesService>() }],
    }).compile();

    controller = module.get<ResourcesController>(ResourcesController);
    service = module.get<ResourcesService>(ResourcesService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("put", () => {
    it("ResourcesService.putSharedResourcesが実行されること", async () => {
      const base64 =
        "JTdCJTIybW9iaWxpdHlIdWJJZCUyMiUzQSUyMkUxQS0wMDEtVSUyMiUyQyUyMmZyZWlnaHRJZCUyMiUzQSUyMjEyMy00NTYtNzg5JTIyJTJDJTIydHJ1Y2tJZCUyMiUzQSUyMiVFNSU5MyU4MSVFNSVCNyU5RCUyMDEwMiUyMCVFMyU4MSU4MiUyMDEwLTA5JTIyJTJDJTIyc2l6ZUNsYXNzJTIyJTNBJTIybGFyZ2UyMDUwQ2xhc3MlMjIlN0Q=";
      const putDto = plainToInstance(SharedResourcesPutBodyDTO, {
        dataModelType: "test1",
        attribute: {
          category: "mobilityhub",
          statuses: [
            {
              value: base64,
              validFrom: "2024-10-21T09:00:00.000Z",
              validUntil: "2024-10-21T10:00:00.000Z",
            },
          ],
        },
      });
      const expectedValue: any = {
        dataModelType: "test1",
        attribute: {
          category: "mobilityhub",
          statuses: [
            {
              key: "A0JYEyM3-21453354856",
              value: base64,
              validFrom: "2024-10-21T09:00:00.000Z",
              validUntil: "2024-10-21T10:00:00.000Z",
            },
          ],
        },
      };
      const spyPutSharedResources = jest.spyOn(service, "putSharedResources").mockReturnValue(expectedValue);
      await controller.putSharedResources(putDto);
      expect(spyPutSharedResources).toHaveBeenCalledWith(putDto);
    });
  });

  describe("delete", () => {
    it("ResourcesService.deleteSharedResourcesが実行されること", async () => {
      const deleteDto = plainToInstance(SharedResourcesDeleteBodyDTO, {
        keyFilter: "A0JYEyM3-21453354856",
      });
      const expectedValue: any = {
        result: "success",
      };
      const spyDeleteSharedResources = jest.spyOn(service, "deleteSharedResources").mockReturnValue(expectedValue);
      await controller.deleteSharedResources(deleteDto);
      expect(spyDeleteSharedResources).toHaveBeenCalledWith(deleteDto);
    });

    it("指定した共有資源が共有資源管理テーブルに無い場合はNotFoundExceptionがThrowされること", async () => {
      const deleteDto = plainToInstance(SharedResourcesDeleteBodyDTO, {
        keyFilter: "AAA",
      });

      const spyDeleteSharedResourcesNotFound = jest.spyOn(service, "deleteSharedResources").mockImplementation(() => {
        throw new NotFoundException();
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.deleteSharedResources(deleteDto)).rejects.toThrow(NotFoundException);
      // serviceのdeleteSharedResourcesが呼ばれることの確認
      expect(spyDeleteSharedResourcesNotFound).toHaveBeenCalledWith(deleteDto);
    });

    it("DB接続が失敗した場合はInternalServerErrorExceptionがThrowされること", async () => {
      const deleteDto = plainToInstance(SharedResourcesDeleteBodyDTO, {
        keyFilter: "A0JYEyM3-21453354856",
      });

      const spyDeleteSharedResourcesNotConnected = jest.spyOn(service, "deleteSharedResources").mockImplementation(() => {
        throw new CannotExecuteNotConnectedError("DB接続エラー");
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.deleteSharedResources(deleteDto)).rejects.toThrow(InternalServerErrorException);
      // serviceのdeleteSharedResourcesが呼ばれることの確認
      expect(spyDeleteSharedResourcesNotConnected).toHaveBeenCalledWith(deleteDto);
    });
  });
});
