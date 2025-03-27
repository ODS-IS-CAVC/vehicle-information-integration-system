import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Validate } from "class-validator";
import { IsGeometry, IsBBox, IsCity, IsMesh, IsGeometryOptional } from "src/modules/shares/dto.validate";

/** C-2-2[B] 空間ID列データモデル取得APIのリクエスト */
export class VoxelsQueryDTO {
  @ApiPropertyOptional({
    description: "C-2-2[B] バウンディングボックス（矩形領域座標)データ。「SW(経度), SW(緯度), NE(経度), NE(緯度)」",
    type: [Number],
    format: "double",
    example: "[139.681994465,35.50676814,139.681985082,35.506773265]",
  })
  @IsOptional()
  @Validate(IsBBox)
  @Validate(IsGeometry)
  bbox: number[];

  @ApiPropertyOptional({
    description: "C-2-2[B] メッシュコード データモデル 1st-mesh=4digits, 2nd-mesh=6digits, 3rd-mesh=8digits",
    format: "int32",
    example: "123456",
  })
  @IsOptional()
  @Validate(IsMesh)
  @Validate(IsGeometry)
  mesh: number;

  @ApiPropertyOptional({
    description: "C-2-2[B] 行政区画コード データモデル",
    format: "int32",
    example: "1203",
  })
  @IsOptional()
  @Validate(IsCity)
  @Validate(IsGeometry)
  city: string;

  @ApiPropertyOptional({
    description: "道路名称。道路名称絞り込み対象の場合に指定可能",
    example: "",
  })
  @IsOptional()
  @IsString()
  @Validate(IsGeometryOptional)
  roadName: string;

  @ApiPropertyOptional({
    description: "ズームレベル",
    format: "int32",
    example: 23,
    default: 25,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Validate(IsGeometryOptional)
  zoomLevel: number;
}
