import { ApiProperty } from "@nestjs/swagger";
import { IsNumber } from "class-validator";

// TODO: 型設定追加
export class Object3dResponseDTO {
  @ApiProperty({
    description: "3DオブジェクトID",
    format: "int32",
  })
  @IsNumber()
  object3dId: number;
  @ApiProperty({
    description: "ファイル名",
    format: "string",
  })
  fileName: string;
  @ApiProperty({
    description: "ダウンロード用URL情報",
    format: "string",
  })
  url: string;
}

export class GetResult3dObjectUpUrlResponseDto {
  @ApiProperty({
    description: "3Dオブジェクトアップロード用の署名付きURL情報",
    format: "string",
  })
  url: string;
}

export class DeleteResultObjectOperationResponseDto {
  @ApiProperty({
    description: "3Dオブジェクト操作結果の削除結果 SUCCESSまたはERROR",
    format: "string",
  })
  result: string;
}

export class PutResultObjectOperationResponseDto {
  @ApiProperty({
    description: "3Dオブジェクト操作結果登録の結果 SUCCESSまたはERROR",
    format: "string",
  })
  result: string;
  @ApiProperty({
    description: "操作結果ID　新規登録時は払い出しされた番号を設定、更新時はリクエスト内容をそのまま設定",
    format: "int32",
  })
  operationId: number;
}

export class ObjectOperationResponseDto {
  @ApiProperty({
    description: "操作結果ID",
    format: "int32",
  })
  operationId?: number;
  @ApiProperty({
    description: "操作結果タイトル",
    format: "string",
  })
  title: string;
  @ApiProperty({
    description: "点群ID",
    format: "int32",
  })
  pointCloudUniqueId: number;
  @ApiProperty({
    description: "3DオブジェクトID",
    format: "int32",
  })
  object3dId: number;
  @ApiProperty({
    description: "3Dオブジェクトのダウンロード用URL情報",
    format: "string",
  })
  url: string;

  @ApiProperty({
    description: "potree座標情報[x,y,z]",
    format: "[double,double,double]",
  })
  putCoordinates: number[];
  @ApiProperty({
    description: "x方向の回転量",
    format: "double",
  })
  xRotation: number;
  @ApiProperty({
    description: "y方向の回転量",
    format: "double",
  })
  yRotation: number;
  @ApiProperty({
    description: "z方向の回転量",
    format: "double",
  })
  zRotation: number;
  @ApiProperty({
    description: "拡大・縮小倍率",
    format: "double",
  })
  scale: number;
}

export class PutResultObjectOperationTitleResponseDto {
  @ApiProperty({
    description: "3Dオブジェクト操作結果タイトル変更の結果 SUCCESSまたはERROR",
    format: "string",
  })
  result: string;
}
