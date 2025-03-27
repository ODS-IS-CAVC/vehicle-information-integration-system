import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional } from "class-validator";

/** C-2-2[B] HD地図区画線データモデル取得APIレスポンス.properties*/
export class RoadHdLaneLineProperties {
  @ApiPropertyOptional({
    description: "HDロードセグメントID",
    format: "int32",
  })
  @IsOptional()
  @IsNumber()
  roadSegmentId?: number;

  @ApiPropertyOptional({
    description: "HD区画線番号",
    format: "int32",
  })
  @IsOptional()
  @IsNumber()
  ordinalId?: number;

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
    description: "線色",
    format: "int32",
  })
  @IsOptional()
  @IsNumber()
  color?: number;

  @ApiPropertyOptional({
    description: "線種",
    format: "int32",
  })
  @IsOptional()
  @IsNumber()
  type?: number;

  @ApiPropertyOptional({
    description: "線幅",
    format: "int32",
  })
  @IsOptional()
  @IsNumber()
  width?: number;

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
    description: "道路種別コード。SDマップと関連がない場合は-1。",
    format: "int32",
  })
  @IsOptional()
  @IsNumber()
  classCode?: number;

  @ApiPropertyOptional({
    description: "路線名称コード。SDマップと関連がない、またはSD道路名が紐づいていない場合は-1。",
    format: "int32",
  })
  @IsOptional()
  @IsNumber()
  nameCode?: number;
}
