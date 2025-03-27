import { BadRequestException } from "@nestjs/common";
import { FileValidationPipe } from "../file-validation.pipe";

describe("FileValidationPipe", () => {
  it("file情報が存在しない場合、エラーになること", async () => {
    const fileValidate = new FileValidationPipe();
    try {
      fileValidate.transform(null);
    } catch (error) {
      expect(error).toEqual(new BadRequestException());
    }
  });
  it("拡張子が.glbかつ、メタ情報も正しい場合、エラーにならないこと", async () => {
    const fileValidate = new FileValidationPipe();
    try {
      const request: any = {
        originalname: "test.glb",
        buffer: Buffer.from([0x67, 0x6c, 0x54, 0x46]),
      };
      expect(fileValidate.transform(request)).toBeTruthy();
    } catch (error) {
      expect(error).toEqual(new BadRequestException());
    }
  });
  it("拡張子が.glbだが、メタ情報が正しくない場合、エラーになること", async () => {
    const fileValidate = new FileValidationPipe();
    try {
      const request: any = {
        originalname: "test.glb",
        buffer: Buffer.from([0x67, 0x6c]),
      };
      fileValidate.transform(request);
    } catch (error) {
      expect(error).toEqual(new BadRequestException());
    }
  });
  it("拡張子が.objかつ、メタ情報も正しい場合、エラーにならないこと", async () => {
    const fileValidate = new FileValidationPipe();
    try {
      const request: any = {
        originalname: "test.obj",
        buffer: Buffer.from([0x23, 0x20, 0x42, 0x6c]),
      };
      expect(fileValidate.transform(request)).toBeTruthy();
    } catch (error) {
      expect(error).toEqual(new BadRequestException());
    }
  });
  it("拡張子が.objだが、メタ情報が正しくない場合、エラーになること", async () => {
    const fileValidate = new FileValidationPipe();
    try {
      const request: any = {
        originalname: "test.obj",
        buffer: Buffer.from([0x23]),
      };
      fileValidate.transform(request);
    } catch (error) {
      expect(error).toEqual(new BadRequestException());
    }
  });
});
