import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsNumber, IsNotEmpty, Validate } from "class-validator";
import { Type } from "class-transformer";
import { IsBBox, IsCity, IsGeometry, IsMesh } from "src/modules/shares/dto.validate";

// TODO: 型設定追加
export class GetPointCloudDlUrlQueryDto {
  @ApiProperty({
    description: "分割申請ID",
    format: "int32",
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  requestId: number;
}

export class GetPointCloudListQueryDto {
  @ApiPropertyOptional({
    description: "緯度",
    format: "double",
    example: "35.50676814",
    type: Number,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  lat: number;

  @ApiPropertyOptional({
    description: "経度",
    format: "double",
    example: "139.681994465",
    type: Number,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  lon: number;

  @ApiPropertyOptional({
    description: "バウンディングボックス（矩形領域座標)データモデル\n\n" + "SW(経度), SW(緯度), NE(経度), NE(緯度)",
    format: "double",
    example: "[139.681994465,35.50676814,139.681985082,35.506773265]",
    type: [Number],
  })
  @IsOptional()
  @Validate(IsBBox)
  @Validate(IsGeometry)
  bbox: number[];
  @ApiPropertyOptional({
    description: "行政区画コード データモデル",
    type: "int32",
    example: "1203",
  })
  @IsOptional()
  @Validate(IsCity)
  @Validate(IsGeometry)
  city: string;

  @ApiPropertyOptional({
    description: "メッシュコード データモデル\n\n" + "1st-mesh=4digits, 2nd-mesh=6digits, 3rd-mesh=8digits",
    type: "int32",
    example: "123456",
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Validate(IsMesh)
  @Validate(IsGeometry)
  mesh: number;
}

export class DeletePointCloudSplitQueryDto {
  @ApiProperty({
    description: "分割申請ID",
    format: "int32",
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  requestId: number;
}
