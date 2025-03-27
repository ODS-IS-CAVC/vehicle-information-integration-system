import { ResourcesService } from "../resources.service";
import { SharedResources } from "../../../entities/share/shared-resources.entity";
import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SharedResourcesPutBodyDTO } from "../dto/resources-put-body.dto";
import { plainToInstance } from "class-transformer";
import { SharedResourcesDeleteBodyDTO } from "../dto/resources-delete-body.dto";
import { SharedResourcesPutResponseDTO } from "../dto/resources-put-response.dto";
import { createDb, resetDb } from "./db-reset/db-reset";
import { DeleteResponse } from "src/consts/resource.const";
import { UtilModule } from "src/modules/util/util.module";

describe("ResourcesService", () => {
  let service: ResourcesService;
  let putDto: SharedResourcesPutBodyDTO;
  let putResponseDto: SharedResourcesPutResponseDTO;
  let deleteDto: SharedResourcesDeleteBodyDTO;
  let module: TestingModule;

  beforeAll(async () => {
    await createDb();
  });

  afterAll(async () => {
    await resetDb();
    await module.close();
  });

  beforeEach(async () => {
    module = await Test.createTestingModule({
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
        TypeOrmModule.forFeature([SharedResources]),
        UtilModule,
      ],
      providers: [ResourcesService],
    }).compile();

    service = module.get<ResourcesService>(ResourcesService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("putSharedResources", () => {
    const base64 =
      "JTdCJTIybW9iaWxpdHlIdWJJZCUyMiUzQSUyMkUxQS0wMDEtVSUyMiUyQyUyMmZyZWlnaHRJZCUyMiUzQSUyMjEyMy00NTYtNzg5JTIyJTJDJTIydHJ1Y2tJZCUyMiUzQSUyMiVFNSU5MyU4MSVFNSVCNyU5RCUyMDEwMiUyMCVFMyU4MSU4MiUyMDEwLTA5JTIyJTJDJTIyc2l6ZUNsYXNzJTIyJTNBJTIybGFyZ2UyMDUwQ2xhc3MlMjIlN0Q=";

    putDto = plainToInstance(SharedResourcesPutBodyDTO, {
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
    putResponseDto = plainToInstance(SharedResourcesPutResponseDTO, {
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
    });

    it("受け取った引数を元に共有資源が新規作成されること", async () => {
      const result = await service.putSharedResources(putDto);
      expect(result).toEqual(putResponseDto);
    });
    it("受け取った引数にvalidUntilの項目が存在しない場合、validUntilにvalidFromの一時間後が設定された共有資源が新規作成されること", async () => {
      putDto = plainToInstance(SharedResourcesPutBodyDTO, {
        ...putDto,
        dataModelType: "test1",
        attribute: {
          ...putDto.attribute,
          category: "mobilityhub",
          statuses: [
            {
              value: base64,
              validFrom: "2024-10-21T09:00:00.000Z",
            },
          ],
        },
      });
      const result = await service.putSharedResources(putDto);
      expect(result).toEqual(putResponseDto);
    });
  });
  describe("deleteSharedResources", () => {
    deleteDto = plainToInstance(SharedResourcesDeleteBodyDTO, {
      keyFilter: "A0JYEyM3-21453354856",
    });
    it("keyFilterで指定した共有資源が存在する場合、正常に値(SUCCESS)が返却されること", async () => {
      const expectValue: DeleteResponse = { result: "SUCCESS" };
      const result = await service.deleteSharedResources(deleteDto);
      expect(result).toEqual(expectValue);
    });
  });
});
