import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsString, IsNotEmpty, IsOptional, IsArray } from "class-validator";
import { Type } from "class-transformer";

// TODO: 型設定追加
export class PutObjectOperationBodyDto {
  @ApiPropertyOptional({
    description: "操作結果ID",
    format: "int32",
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  operationId?: number;
  @ApiProperty({
    description: "操作結果タイトル",
    format: "string",
  })
  @Type(() => String)
  @IsString()
  @IsNotEmpty()
  title: string;
  @ApiProperty({
    description: "点群ID",
    format: "int32",
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  pointCloudUniqueId: number;
  @ApiProperty({
    description: "3DオブジェクトID",
    format: "int32",
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  object3dId: number;
  @ApiProperty({
    description: "potree座標情報[x,y,z]",
    format: "[double,double,double]",
  })
  @IsArray()
  @IsNotEmpty()
  putCoordinates: number[];
  @ApiProperty({
    description: "x方向の回転量",
    format: "double",
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  xRotation: number;
  @ApiProperty({
    description: "y方向の回転量",
    format: "double",
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  yRotation: number;
  @ApiProperty({
    description: "z方向の回転量",
    format: "double",
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  zRotation: number;
  @ApiProperty({
    description: "拡大・縮小倍率",
    format: "double",
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  scale: number;
}

export class PutObjectOperationTitleBodyDto {
  @ApiProperty({
    description: "操作結果ID",
    format: "int32",
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  operationId: number;
  @ApiProperty({
    description: "操作結果タイトル",
    format: "string",
  })
  @Type(() => String)
  @IsString()
  @IsNotEmpty()
  title: string;
}
