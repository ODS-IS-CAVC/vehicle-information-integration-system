import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsNotEmpty } from "class-validator";
import { Type } from "class-transformer";

// TODO: 型設定追加
export class PutPointCloudSplitBodyDto {
  @ApiProperty({
    description: "始点",
    format: "PointObject",
  })
  @IsNotEmpty()
  startPoint: { lat: number; lon: number };
  @ApiProperty({
    description: "終点",
    format: "PointObject",
  })
  @IsNotEmpty()
  endPoint: { lat: number; lon: number };
  @ApiProperty({
    description: "点群ID",
    format: "int32",
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  pointCloudUniqueId: number;
}
