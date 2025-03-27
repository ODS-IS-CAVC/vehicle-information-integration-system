import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsArray, IsString } from "class-validator";

/** C-2-2[B] 入口出口閉鎖情報データモデル取得APIレスポンス.properties*/
export class RoadEntryExitProperties {
  @ApiPropertyOptional({
    description: "情報取得日時",
    format: "date-time",
  })
  @IsOptional()
  @IsString()
  timestamp?: string;

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
    description: "路線名称。（電文フォーマット【P21-4】ただし情報源がリンク情報である場合は省略）",
  })
  @IsOptional()
  @IsString()
  routeName?: string;

  @ApiPropertyOptional({
    description: "方向名称。（電文フォーマット【P21-5】ただし情報源がリンク情報である場合は省略）",
  })
  @IsOptional()
  @IsString()
  directionName?: string;

  @ApiPropertyOptional({
    description: "入口出口名称。（電文フォーマット【P78-5】）",
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: "C-2-2[B] 座標（緯度経度高度）データモデル",
    type: [Number],
    format: "double",
  })
  @IsArray()
  @IsOptional()
  @IsNumber({}, { each: true })
  location?: number[];

  @ApiPropertyOptional({
    description: "入口出口識別子。1=入口、2=出口。（電文フォーマット【P78-10】を反転）",
    format: "int32",
  })
  @IsOptional()
  @IsNumber()
  isEntrance?: number;
}
