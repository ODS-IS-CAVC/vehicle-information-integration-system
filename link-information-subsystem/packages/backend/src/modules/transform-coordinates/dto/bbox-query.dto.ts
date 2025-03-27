import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, Validate } from "class-validator";
import { IsGeometry, IsCity, IsMesh, IsGeometryOptional } from "src/modules/shares/dto.validate";
import { Geodetic } from "src/shares/lib/proj4";

/** C-2-2[B] バウンディングボックス（矩形領域座標)データモデル取得のリクエスト */
export class BBoxQueryDTO {
  @ApiPropertyOptional({
    description: "voxel x（東西方向）インデックス",
    format: "int32",
    example: "12",
  })
  @IsOptional()
  @Validate(IsGeometry)
  @Type(() => Number)
  @IsInt()
  x: number;

  @ApiPropertyOptional({
    description: "voxel y（南北方向）インデックス",
    format: "int32",
    example: "23",
  })
  @IsOptional()
  @Validate(IsGeometry)
  @Type(() => Number)
  @IsInt()
  y: number;

  @ApiPropertyOptional({
    description: "voxel z ズームレベル",
    format: "int32",
    example: "24",
  })
  @IsOptional()
  @Validate(IsGeometry)
  @Type(() => Number)
  @IsInt()
  z: number;

  @ApiPropertyOptional({
    description: "voxel f（鉛直方向）インデックス",
    format: "int32",
    example: "0",
  })
  @IsOptional()
  @Validate(IsGeometry)
  @Type(() => Number)
  @IsInt()
  f: number;

  @ApiPropertyOptional({
    description: "C-2-2[B] メッシュコード データモデル",
    format: "int32",
    example: "1223456",
  })
  @IsOptional()
  @Validate(IsMesh)
  @Validate(IsGeometry)
  @Type(() => Number)
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
    description: "測地系",
    example: "EPSG4326",
    default: "JGD2011",
  })
  @IsOptional()
  @Validate(IsGeometryOptional)
  geodetic: Geodetic;
}
