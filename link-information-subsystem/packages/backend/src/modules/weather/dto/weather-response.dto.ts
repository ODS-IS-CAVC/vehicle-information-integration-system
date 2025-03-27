import { ApiProperty, ApiPropertyOptional, getSchemaPath } from "@nestjs/swagger";
import { IsNotEmptyObject, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";

export class WeatherGeometryDto {
  @ApiPropertyOptional({
    description: "ジオメトリ形式",
  })
  @IsString()
  type: string;

  @ApiPropertyOptional({
    type: "array",
    items: { type: "array", items: { type: "number" } },
    description: "C-2-2[B] 座標列(LineString)データモデル",
  })
  coordinates: number[][][];
}

type Properties = WaterFilmThicknessProps | WindProps;

export class WaterFilmThicknessProps {
  @ApiPropertyOptional({
    description: "HDロードセグメントID",
    format: "int32",
  })
  @IsOptional()
  @IsNumber()
  roadSegmentId?: number;

  @ApiPropertyOptional({
    description: "HDレーン番号",
    format: "int32",
  })
  @IsOptional()
  @IsNumber()
  laneNumber?: number;

  @ApiPropertyOptional({
    description: "HDシーケンス番号最小値",
    format: "int32",
  })
  @IsOptional()
  @IsNumber()
  minSeq?: number;

  @ApiPropertyOptional({
    description: "HDシーケンス番号最大値",
    format: "int32",
  })
  @IsOptional()
  @IsNumber()
  maxSeq?: number;

  @ApiPropertyOptional({
    description: "SD道路リンクID。SDマップと関連がない場合は-1。",
    format: "int32",
  })
  @IsOptional()
  @IsNumber()
  linkId?: number;

  @ApiPropertyOptional({
    description: "SD道路リンク方向。SDマップと関連がない場合は-1。1=正方向、2=逆方向",
    format: "int32",
  })
  @IsOptional()
  @IsNumber()
  direction?: number;

  @ApiPropertyOptional({
    description: "水膜厚(mm)",
    format: "int32",
  })
  @IsOptional()
  @IsNumber()
  waterfilms?: number;
}

export class WindProps {
  @ApiPropertyOptional({
    description: "HDロードセグメントID",
    format: "int32",
  })
  @IsOptional()
  @IsNumber()
  roadSegmentId?: number;

  @ApiPropertyOptional({
    description: "HDシーケンス番号最小値",
    format: "int32",
  })
  @IsOptional()
  @IsNumber()
  minSeq?: number;

  @ApiPropertyOptional({
    description: "HDシーケンス番号最大値",
    format: "int32",
  })
  @IsOptional()
  @IsNumber()
  maxSeq?: number;

  @ApiPropertyOptional({
    description: "SD道路リンクID。SDマップと関連がない場合は-1。",
    format: "int32",
  })
  @IsOptional()
  @IsNumber()
  linkId?: number;

  @ApiPropertyOptional({
    description: "SD道路リンク方向。SDマップと関連がない場合は-1。1=正方向、2=逆方向",
    format: "int32",
  })
  @IsOptional()
  @IsNumber()
  direction?: number;
  @ApiPropertyOptional({
    description: "風速(m/s)",
    format: "int32",
  })
  @IsOptional()
  @IsNumber()
  windSpeed?: number;
  @ApiPropertyOptional({
    description: "風向。北=0度,東=90度,南=180度,西=270度。",
    format: "int32",
  })
  @IsOptional()
  @IsNumber()
  windDirection?: number;
}

export class WeatherRisk {
  @ApiPropertyOptional()
  @IsString()
  type: string;

  @ApiPropertyOptional()
  @ValidateNested()
  geometry: WeatherGeometryDto;

  @ApiPropertyOptional({
    oneOf: [{ $ref: getSchemaPath(WaterFilmThicknessProps) }, { $ref: getSchemaPath(WindProps) }],
  })
  @IsNotEmptyObject()
  @ValidateNested()
  properties: Properties;
}

export class GetWeatherRiskResponseDto {
  @ApiProperty({
    description: "フィーチャID",
  })
  @IsString()
  type: string;

  @ApiProperty({
    description: "フィーチャ配列",
    type: () => [WeatherRisk],
  })
  @ValidateNested({ each: true })
  features: WeatherRisk[];
}
