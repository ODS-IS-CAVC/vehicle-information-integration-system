import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Validate } from "class-validator";
import { IsTwoVoxels } from "src/modules/shares/dto.validate";

import { Geodetic } from "src/shares/lib/proj4";

/** C-2-2[B] 座標列(LineString)データモデル取得のリクエスト */
export class LineStringsQueryDTO {
  @ApiPropertyOptional({
    description: "startVoxel x（東西方向）インデックス",
    format: "int32",
    example: "12",
  })
  @IsOptional()
  @Validate(IsTwoVoxels)
  @Type(() => Number)
  @IsInt()
  startX: number;

  @ApiPropertyOptional({
    description: "startVoxel y（南北方向）インデックス",
    format: "int32",
    example: "23",
  })
  @IsOptional()
  @Validate(IsTwoVoxels)
  @Type(() => Number)
  @IsInt()
  startY: number;

  @ApiPropertyOptional({
    description: "startVoxel z ズームレベル",
    format: "int32",
    example: "24",
  })
  @IsOptional()
  @Validate(IsTwoVoxels)
  @Type(() => Number)
  @IsInt()
  startZ: number;

  @ApiPropertyOptional({
    description: "startVoxel f（鉛直方向）インデックス",
    format: "int32",
    example: "0",
  })
  @IsOptional()
  @Validate(IsTwoVoxels)
  @Type(() => Number)
  @IsInt()
  startF: number;

  @ApiPropertyOptional({
    description: "endVoxel x（東西方向）インデックス",
    format: "int32",
    example: "22",
  })
  @IsOptional()
  @Validate(IsTwoVoxels)
  @Type(() => Number)
  @IsInt()
  endX: number;

  @ApiPropertyOptional({
    description: "endVoxel y（南北方向）インデックス",
    format: "int32",
    example: "33",
  })
  @IsOptional()
  @Validate(IsTwoVoxels)
  @Type(() => Number)
  @IsInt()
  endY: number;

  @ApiPropertyOptional({
    description: "endVoxel z ズームレベル",
    format: "int32",
    example: "25",
  })
  @IsOptional()
  @Validate(IsTwoVoxels)
  @Type(() => Number)
  @IsInt()
  endZ: number;

  @ApiPropertyOptional({
    description: "endVoxel f（鉛直方向）インデックス",
    format: "int32",
    example: "0",
  })
  @IsOptional()
  @Validate(IsTwoVoxels)
  @Type(() => Number)
  @IsInt()
  endF: number;

  @ApiPropertyOptional({
    description: "道路名称。道路名称絞り込み対象の場合に指定可能",
  })
  @IsOptional()
  @IsString()
  @Validate(IsTwoVoxels)
  roadName: string;

  @ApiPropertyOptional({
    description: "測地系",
    example: "EPSG4326",
    default: "JGD2011",
  })
  @IsOptional()
  @Validate(IsTwoVoxels)
  geodetic: Geodetic;
}
