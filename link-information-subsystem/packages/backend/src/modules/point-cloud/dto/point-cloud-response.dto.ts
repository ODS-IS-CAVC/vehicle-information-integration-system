import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsNumber, IsOptional, IsString } from "class-validator";

export class CRSDto {
  @ApiProperty({
    description: "name",
  })
  @IsString()
  type: string;
  @ApiProperty({
    description: "properties(EPSGコード)",
  })
  @IsString()
  properties: { name: string };
}

export class PointCloudGeometryDto {
  @ApiProperty({
    description: "ジオメトリ形式",
  })
  @IsString()
  type: string;

  @ApiProperty({
    description: "CRS",
  })
  crs: CRSDto;

  @ApiProperty({
    description: "MultiLineStringデータモデル",
  })
  coordinates: number[][][];
}

export class PutResultPointCloudSplitResponseDto {
  @ApiProperty({
    description: "点群データ分割(切出)申請登録 SUCCESSまたはERROR",
    format: "string",
  })
  result: string;
}

export class GetResultPointCloudDlUrlResponseDto {
  @ApiProperty({
    description: "分割済み点群データダウンロードURL",
    format: "string",
  })
  url: string;
}

export class SplitStatus {
  @ApiProperty({
    description: "分割申請ID",
    format: "int32",
  })
  requestId: number;
  @ApiProperty({
    description: "申請日時",
    format: "Date",
  })
  requestDate: Date;
  @ApiProperty({
    description: "分割指定点群ファイル名",
    format: "string",
  })
  pointCloudSceneName: string;
  @ApiProperty({
    description: "分割状況",
    format: "int32",
  })
  status: number;
}

export class GetResultPointCloudSplitStatusResponseDto {
  @ApiProperty({
    description: "点群ファイル分割状況配列",
    format: "Array",
  })
  splitStatusList: [SplitStatus];
}
export class DeleteResultPointCloudSplitResponseDto {
  @ApiProperty({
    description: "分割後点群データ削除結果 SUCCESSまたはERROR",
    format: "string",
  })
  result: string;
}

export class PointCloudProperty {
  @ApiPropertyOptional({
    description: "点群ID",
    format: "int32",
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  pointCloundUniqueId?: number;

  @ApiPropertyOptional({
    description: "metadata.jsonの格納場所を示すURL情報",
    format: "string",
  })
  @Type(() => String)
  @IsOptional()
  @IsString()
  url?: string;

  @ApiPropertyOptional({
    description: "シーン名",
    format: "string",
  })
  @Type(() => String)
  @IsOptional()
  @IsString()
  sceneName?: string;

  @ApiPropertyOptional({
    description: "取得日時",
    format: "string",
  })
  @Type(() => String)
  @IsOptional()
  @IsString()
  acquisitionDate?: string;

  @ApiPropertyOptional({
    description: "タグ情報",
    format: "string",
  })
  @Type(() => Array)
  @IsOptional()
  @IsArray()
  tags?: string[];
}

export class PointCloud {
  @ApiProperty()
  @IsString()
  type: string;

  @ApiProperty()
  @Type(() => PointCloudGeometryDto)
  geometry: PointCloudGeometryDto;

  @ApiProperty()
  @Type(() => Object)
  properties: PointCloudProperty;
}

export class GetResultPointCloudListResponseDto {
  @ApiProperty({
    description: "フィーチャID",
  })
  @IsString()
  type: string;

  @ApiProperty({
    type: () => [PointCloud],
    description: "フィーチャ配列",
  })
  features: [PointCloud];
}
