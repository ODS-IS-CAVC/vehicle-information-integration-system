import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsArray, IsString } from "class-validator";
import { HANDLING_STATUS, LANE_CATEGORY, PREDICTION } from "src/consts/map.const";

/** C-2-2[B] 交通渋滞・規制情報データモデル取得APIレスポンス.properties*/
export class RoadTrafficProperties {
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
    description: "事象の原因。提供名称か詳細名称のいずれか。（電文フォーマット【P21-14】ただし情報源がリンク情報である場合は【P15-5】）",
  })
  @IsOptional()
  @IsString()
  cause?: string;

  @ApiPropertyOptional({
    description: "規制内容。提供名称か詳細名称のいずれか。（電文フォーマット【P21-17】ただし情報源がリンク情報である場合は【P15-6】）",
  })
  @IsOptional()
  @IsString()
  regulation?: string;

  @ApiPropertyOptional({
    description:
      "渋滞度。渋滞＝1,混雑＝2,対象外(渋滞情報ではない場合)=0。（渋滞長が正数の場合に1、それ以外の場合は0。ただし情報源がリンク情報である場合は電文フォーマット【P15-7】。リンク情報の場合のみ値2が設定される場合がある。）",
    format: "int32",
  })
  @IsOptional()
  @IsNumber()
  severity?: number;

  @ApiPropertyOptional({
    description:
      "渋滞長(m)。本事象が渋滞情報の場合に渋滞長を設定。（電文フォーマット【P21-21】ただし情報源がリンク情報である場合は【P15-10】）",
    format: "int32",
  })
  @IsOptional()
  @IsNumber()
  length?: number;

  @ApiPropertyOptional({
    description: "下流位置KP情報。10mを1単位として格納。（電文フォーマット【P22-22】ただし情報源がリンク情報である場合は省略）",
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
    description: "（リンク内で）事象下流までの距離(m)。（電文フォーマット【P22-23】ただし情報源がリンク情報である場合は【P15-9】）",
    format: "int32",
  })
  @IsOptional()
  @IsNumber()
  downstreamDistance?: number;

  @ApiPropertyOptional({
    description: "上流位置KP情報。10mを1単位として格納。（（電文フォーマット【P22-24】ただし情報源がリンク情報である場合は省略）",
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
    description: "（リンク内で）事象下流までの距離(m)。（電文フォーマット【P22-23】ただし情報源がリンク情報である場合は【P15-9】）",
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
    description: "規制解除予定日時。（電文フォーマット【P23-40】ただし情報源がリンク情報である場合は省略）",
    format: "date-time",
  })
  @IsOptional()
  @IsString()
  plannedEndTimestamp?: string;

  @ApiPropertyOptional({
    description: "原因車両名1。（電文フォーマット【P23-46】ただし情報源がリンク情報である場合は省略）",
  })
  @IsOptional()
  @IsString()
  causeVehicleName1?: string;

  @ApiPropertyOptional({
    description: "原因車両数1。（電文フォーマット【P23-47】ただし情報源がリンク情報である場合は省略）",
    format: "int32",
  })
  @IsOptional()
  @IsNumber()
  causeVehicleNumber1?: number;

  @ApiPropertyOptional({
    description: "原因車両名2。（電文フォーマット【P23-46】ただし情報源がリンク情報である場合は省略）",
  })
  @IsOptional()
  @IsString()
  causeVehicleName2?: string;

  @ApiPropertyOptional({
    description: "原因車両数2。（電文フォーマット【P23-47】ただし情報源がリンク情報である場合は省略）",
    format: "int32",
  })
  @IsOptional()
  @IsNumber()
  causeVehicleNumber2?: number;

  @ApiPropertyOptional({
    description: "原因車両名3。（電文フォーマット【P23-46】ただし情報源がリンク情報である場合は省略）",
  })
  @IsOptional()
  @IsString()
  causeVehicleName3?: string;

  @ApiPropertyOptional({
    description: "原因車両数3。（電文フォーマット【P23-47】ただし情報源がリンク情報である場合は省略）",
    format: "int32",
  })
  @IsOptional()
  @IsNumber()
  causeVehicleNumber3?: number;

  @ApiPropertyOptional({
    enum: HANDLING_STATUS,
    description: "障害処理状況。（電文フォーマット【P23-57】ただし情報源がリンク情報である場合は省略）",
  })
  @IsOptional()
  @IsString()
  handlingStatus?: string;

  @ApiPropertyOptional({
    enum: PREDICTION,
    description: "予測。（電文フォーマット【P23-58】ただし情報源がリンク情報である場合は省略）",
  })
  @IsOptional()
  @IsString()
  prediction?: string;

  @ApiPropertyOptional({
    description: "復旧予定日時。（電文フォーマット【P23-60】ただし情報源がリンク情報である場合は省略）",
    format: "date-time",
  })
  @IsOptional()
  @IsString()
  plannedResumeTimestamp?: string;
}
