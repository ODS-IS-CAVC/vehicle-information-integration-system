import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional } from "class-validator";

/** C-2-2[B] HD地図車線中心線・交通規制情報データモデル取得APIレスポンス.properties*/
export class RoadHdLaneCenterProperties {
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

  @ApiPropertyOptional({
    description: "通行禁止。SDマップと関連があり、かつ規制対象の場合は1。そうでない場合は0。",
    format: "int32",
  })
  @IsOptional()
  @IsNumber()
  hasNopass?: number;

  @ApiPropertyOptional({
    description: "指定外進入禁止対象。SDマップと関連があり、かつ規制対象の場合は1。そうでない場合は0。",
    format: "int32",
  })
  @IsOptional()
  @IsNumber()
  hasNoturn?: number;

  @ApiPropertyOptional({
    description: "一方通行対象。SDマップと関連があり、かつ規制対象の場合は1。そうでない場合は0。",
    format: "int32",
  })
  @IsOptional()
  @IsNumber()
  hasOneway?: number;

  @ApiPropertyOptional({
    description: "速度制限対象。SDマップと関連があり、かつ規制対象の場合は1。そうでない場合は0。",
    format: "int32",
  })
  @IsOptional()
  @IsNumber()
  hasSpeed?: number;

  @ApiPropertyOptional({
    description: "ゾーン30対象。SDマップと関連があり、かつ規制対象の場合は1。そうでない場合は0。",
    format: "int32",
  })
  @IsOptional()
  @IsNumber()
  hasZone30?: number;
}
