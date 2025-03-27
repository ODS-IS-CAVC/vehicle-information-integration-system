import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsArray, IsString } from "class-validator";

/** C-2-2[B] HD地図交差点データモデル取得APIレスポンス.properties*/
export class RoadHdIIntersectionProperties {
  @ApiPropertyOptional({
    description: "HD交差点ID",
    format: "int32",
  })
  @IsOptional()
  @IsNumber()
  id?: number;

  @ApiPropertyOptional({
    description: "HD道路セグメントID配列。SDマップと関連がない場合は空配列（[]）。",
    format: "int32",
  })
  @IsArray()
  @IsOptional()
  @IsNumber({}, { each: true })
  roadSegmentIds?: number[];

  @ApiPropertyOptional({
    description: '道路種別コード一覧。アンダースコア（_）繋ぎ(例："1")。SDマップと関連がない場合は空配列（[]）。',
  })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  classCodes?: string[];

  @ApiPropertyOptional({
    description: "路線名称コード配列。SDマップと関連がない、またはSD道路名が紐づいていない場合は空配列（[]）。",
    format: "int32",
  })
  @IsArray()
  @IsOptional()
  @IsNumber({}, { each: true })
  nameCodes?: number[];
}
