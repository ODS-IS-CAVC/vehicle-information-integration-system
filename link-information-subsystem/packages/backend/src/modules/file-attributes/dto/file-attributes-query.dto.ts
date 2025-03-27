import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class GetFileAttributesQueryDto {
  @ApiProperty({
    description: "ファイル名",
    format: "string",
  })
  @IsNotEmpty()
  fileName: string;
}
