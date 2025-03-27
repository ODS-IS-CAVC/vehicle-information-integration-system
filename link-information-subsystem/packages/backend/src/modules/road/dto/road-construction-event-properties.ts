import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsNumber, IsOptional, IsString } from "class-validator";
import { LANE_CATEGORY } from "src/consts/map.const";

/** C-2-2[B] 工事行事予定情報データモデル取得APIレスポンス.properties*/
export class RoadConstructionEventProperties {
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
    description: "路線名称。（電文フォーマット【P38-4】）",
  })
  @IsOptional()
  @IsString()
  routeName?: string;

  @ApiPropertyOptional({
    description: "方向名称。（電文フォーマット【P38-5】）",
  })
  @IsOptional()
  @IsString()
  directionName?: string;

  @ApiPropertyOptional({
    description: "事象の原因。提供名称か詳細名称のいずれか。（電文フォーマット【P38-14】）",
  })
  @IsOptional()
  @IsString()
  cause?: string;

  @ApiPropertyOptional({
    description: "規制内容。提供名称か詳細名称のいずれか。（電文フォーマット【P38-17】）",
  })
  @IsOptional()
  @IsString()
  regulation?: string;

  @ApiPropertyOptional({
    description: "下流位置KP情報。10mを1単位として格納。（電文フォーマット【P39-23】）",
    format: "int32",
  })
  @IsOptional()
  @IsNumber()
  downstreamKP?: number;

  @ApiPropertyOptional({
    description: "C-2-2[B] 座標（緯度経度高度）データモデル",
    type: [Number],
    format: "double",
  })
  @IsArray()
  @IsOptional()
  @IsNumber({}, { each: true })
  downstream?: number[];

  @ApiPropertyOptional({
    description: "（リンク内で）事象下流までの距離(m)。（電文フォーマット【P39-24】）",
    format: "int32",
  })
  @IsOptional()
  @IsNumber()
  downstreamDistance?: number;

  @ApiPropertyOptional({
    description: "上流位置KP情報。10mを1単位として格納。（（電文フォーマット【P39-25】）",
    format: "int32",
  })
  @IsOptional()
  @IsNumber()
  upstreamKP?: number;

  @ApiPropertyOptional({
    description: "C-2-2[B] 座標（緯度経度高度）データモデル",
    type: [Number],
    format: "double",
  })
  @IsArray()
  @IsOptional()
  @IsNumber({}, { each: true })
  upstream?: number[];

  @ApiPropertyOptional({
    description: "（リンク内で）事象上流までの距離(m)。（電文フォーマット【P39-26】）",
    format: "int32",
  })
  @IsOptional()
  @IsNumber()
  upstreamDistance?: number;

  @ApiPropertyOptional({
    enum: LANE_CATEGORY,
    description: "本線区分。（電文フォーマット【P23-39】ただし情報源がリンク情報である場合はmain固定）",
  })
  @IsOptional()
  @IsString()
  laneCategory?: string;

  @ApiPropertyOptional({
    description: "規制開始予定日時。（電文フォーマット【P40-41】）",
    format: "date-time",
  })
  @IsOptional()
  @IsString()
  plannedStartTimestamp?: string;

  @ApiPropertyOptional({
    description: "規制解除予定日時。（電文フォーマット【P40-46】）",
    format: "date-time",
  })
  @IsOptional()
  @IsString()
  plannedEndTimestamp?: string;

  @ApiPropertyOptional({
    description: "規制解除日時。（電文フォーマット【P40-51】）",
    format: "date-time",
  })
  @IsOptional()
  @IsString()
  endTimestamp?: string;

  @ApiPropertyOptional({
    description: "迂回路1。（電文フォーマット【P40-56】）",
  })
  @IsOptional()
  @IsString()
  detour1?: string;

  @ApiPropertyOptional({
    description: "迂回路2。（電文フォーマット【P40-57】）",
  })
  @IsOptional()
  @IsString()
  detour2?: string;

  @ApiPropertyOptional({
    description: "現況フラグ。0=現況以外、1=現況。（電文フォーマット【P40-58】を反転）",
    format: "int32",
  })
  @IsOptional()
  @IsNumber()
  isCurrentStatus?: number;
}
