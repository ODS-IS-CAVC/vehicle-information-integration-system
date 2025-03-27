import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsNumber, Validate, IsInt, IsString, IsDateString } from "class-validator";
import { Type } from "class-transformer";
import { IsBBox, IsCity, IsGeometry, IsGeometryOptional, IsMesh } from "src/modules/shares/dto.validate";

export class WeatherListQueryDto {
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
    description: "voxel x（東西方向）インデックス",
    format: "int32",
    example: "12",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Validate(IsGeometry)
  x: number;

  @ApiPropertyOptional({
    description: "voxel y（南北方向）インデックス",
    format: "int32",
    example: "23",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Validate(IsGeometry)
  y: number;

  @ApiPropertyOptional({
    description: "voxel z ズームレベル",
    format: "int32",
    example: "24",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Validate(IsGeometry)
  z: number;

  @ApiPropertyOptional({
    description: "voxel f（鉛直方向）インデックス",
    format: "int32",
    example: "0",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  f: number;
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
  @ApiPropertyOptional({
    description: "タイムスタンプ。指定された日時でシミュレーションを実行する。",
    example: "2024-01-23T11:22:33Z",
  })
  @IsOptional()
  @IsDateString()
  @Validate(IsGeometryOptional)
  timestamp: string;

  @ApiPropertyOptional({
    description: "道路名称。道路名称絞り込み対象の場合に指定可能。",
  })
  @IsOptional()
  @IsString()
  @Validate(IsGeometryOptional)
  roadName: string;
}
