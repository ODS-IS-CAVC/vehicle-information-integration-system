import { BadRequestException, Injectable, PipeTransform } from "@nestjs/common";

@Injectable()
export class FileValidationPipe implements PipeTransform {
  transform(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException();
    }

    const isGLBMagicNumber = file.buffer.subarray(0, 4).equals(Buffer.from([0x67, 0x6c, 0x54, 0x46]));
    const isObjMagicNumber = file.buffer.subarray(0, 4).equals(Buffer.from([0x23, 0x20, 0x42, 0x6c]));

    const isGLBMinetype = file.originalname.endsWith("glb");
    const isOBJMinetype = file.originalname.endsWith("obj");

    if ((isGLBMagicNumber || isObjMagicNumber) && (isGLBMinetype || isOBJMinetype)) {
      return file;
    } else {
      throw new BadRequestException();
    }
  }
}
