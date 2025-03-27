import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { PutObjectOperationBodyDto, PutObjectOperationTitleBodyDto } from "../../dto/object-3d-body.dto";

describe("object-3d-body.dto", () => {
  describe("PutObjectOperationBodyDto", () => {
    it("リクエスト内容の操作IDが存在しない場合、エラーにならないこと", async () => {
      const request = {
        title: "title",
        pointCloudUniqueId: 0,
        object3dId: 0,
        putCoordinates: [1, 2, 3],
        xRotation: 1,
        yRotation: 1,
        zRotation: 1,
        scale: 1,
      };
      const dto = plainToInstance(PutObjectOperationBodyDto, request);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it("リクエスト内容の操作IDが存在する場合、エラーにならないこと", async () => {
      const request = {
        operationId: 0,
        title: "title",
        pointCloudUniqueId: 0,
        object3dId: 0,
        putCoordinates: [1, 2, 3],
        xRotation: 1,
        yRotation: 1,
        zRotation: 1,
        scale: 1,
      };
      const dto = plainToInstance(PutObjectOperationBodyDto, request);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it("リクエスト内容のtitleが存在しない場合、エラーになること", async () => {
      const request = {
        operationId: 0,
        pointCloudUniqueId: 0,
        object3dId: 0,
        putCoordinates: [1, 2, 3],
        xRotation: 1,
        yRotation: 1,
        zRotation: 1,
        scale: 1,
      };
      const dto = plainToInstance(PutObjectOperationBodyDto, request);
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
    });

    it("リクエスト内容の点群IDが存在しない場合、エラーになること", async () => {
      const request = {
        operationId: 0,
        title: "title",
        object3dId: 0,
        putCoordinates: [1, 2, 3],
        xRotation: 1,
        yRotation: 1,
        zRotation: 1,
        scale: 1,
      };
      const dto = plainToInstance(PutObjectOperationBodyDto, request);
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
    });

    it("リクエスト内容の3DオブジェクトIDが存在しない場合、エラーになること", async () => {
      const request = {
        operationId: 0,
        title: "title",
        pointCloudUniqueId: 0,
        putCoordinates: [1, 2, 3],
        xRotation: 1,
        yRotation: 1,
        zRotation: 1,
        scale: 1,
      };
      const dto = plainToInstance(PutObjectOperationBodyDto, request);
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
    });

    it("リクエスト内容のpotree座標情報が存在しない場合、エラーになること", async () => {
      const request = {
        operationId: 0,
        title: "title",
        pointCloudUniqueId: 0,
        object3dId: 0,
        xRotation: 1,
        yRotation: 1,
        zRotation: 1,
        scale: 1,
      };
      const dto = plainToInstance(PutObjectOperationBodyDto, request);
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
    });

    it("リクエスト内容のx方向の回転量が存在しない場合、エラーになること", async () => {
      const request = {
        operationId: 0,
        title: "title",
        pointCloudUniqueId: 0,
        object3dId: 0,
        putCoordinates: [1, 2, 3],
        yRotation: 1,
        zRotation: 1,
        scale: 1,
      };
      const dto = plainToInstance(PutObjectOperationBodyDto, request);
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
    });

    it("リクエスト内容のy方向の回転量が存在しない場合、エラーになること", async () => {
      const request = {
        operationId: 0,
        title: "title",
        pointCloudUniqueId: 0,
        object3dId: 0,
        putCoordinates: [1, 2, 3],
        xRotation: 1,
        zRotation: 1,
        scale: 1,
      };
      const dto = plainToInstance(PutObjectOperationBodyDto, request);
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
    });

    it("リクエスト内容のz方向の回転量が存在しない場合、エラーになること", async () => {
      const request = {
        operationId: 0,
        title: "title",
        pointCloudUniqueId: 0,
        object3dId: 0,
        putCoordinates: [1, 2, 3],
        xRotation: 1,
        yRotation: 1,
        scale: 1,
      };
      const dto = plainToInstance(PutObjectOperationBodyDto, request);
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
    });

    it("リクエスト内容の拡大・縮小倍率が存在しない場合、エラーになること", async () => {
      const request = {
        operationId: 0,
        title: "title",
        pointCloudUniqueId: 0,
        object3dId: 0,
        putCoordinates: [1, 2, 3],
        xRotation: 1,
        yRotation: 1,
        zRotation: 1,
      };
      const dto = plainToInstance(PutObjectOperationBodyDto, request);
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
    });
  });

  describe("PutObjectOperationTitleBodyDto", () => {
    it("リクエスト内容の操作結果IDとtitleが存在する場合、エラーにならないこと", async () => {
      const request = {
        operationId: 0,
        title: "title",
      };
      const dto = plainToInstance(PutObjectOperationTitleBodyDto, request);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it("リクエスト内容の操作結果IDが存在しない場合、エラーになること", async () => {
      const request = {
        title: "title",
      };
      const dto = plainToInstance(PutObjectOperationTitleBodyDto, request);
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
    });

    it("リクエスト内容のtitleが存在しない場合、エラーになること", async () => {
      const request = {
        operationId: 0,
      };
      const dto = plainToInstance(PutObjectOperationTitleBodyDto, request);
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
    });
  });
});
