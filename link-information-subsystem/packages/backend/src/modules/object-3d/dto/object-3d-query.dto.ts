import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNumber, IsNotEmpty, IsString } from "class-validator";

export class GetObjectOperationQueryDto {
  @ApiProperty({
    description: "点群ID",
    format: "int32",
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  pointCloudUniqueId: number;
}

export class GetObjectUpUrlQueryDto {
  @ApiProperty({
    description: "ファイル名",
    format: "sting",
  })
  @IsString()
  @IsNotEmpty()
  filename: string;
}
export class DeleteObjectOperationQueryDto {
  @ApiProperty({
    description: "操作結果ID",
    format: "int32",
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  operationId: number;
}
