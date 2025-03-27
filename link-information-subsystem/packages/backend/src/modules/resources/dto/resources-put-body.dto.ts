import { IsArray, IsDateString, IsIn, IsNotEmpty, IsOptional, IsString, Validate, ValidateNested } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { DATAMODEL_TYPE } from "src/consts/datamodel-type.const";
import { Category } from "src/consts/resource.const";
import { IsValidFromAndValidUntil } from "src/modules/shares/dto.validate";
// 共有資源リクエストボディ

class PutBodyStatusDTO {
  @ApiProperty({
    description:
      "MH予約に必要な全ての属性情報（ただし予約希望時刻・期間を除く）を\n\n" + "JSON形式に整形したものをBASE64エンコードした文字列。",
    example: "base64-mh-reservation-props",
  })
  @IsString()
  value: string;

  @ApiProperty({
    description: "予約開始希望時刻（包含）。（予約開始希望時刻）",
    example: "2024-10-21T09:00:00.000Z",
  })
  @IsNotEmpty()
  @IsDateString()
  @Validate(IsValidFromAndValidUntil)
  validFrom: string;

  @ApiPropertyOptional({
    description:
      "予約終了希望時刻（排他）。\n\n" +
      "予約終了希望時刻の指定が無い場合、予約開始希望時刻から\n\n" +
      "一時間後が自動登録される。有効期限切れデータは自動消去される。",
    example: "2024-10-21T10:00:00.000Z",
  })
  @IsOptional()
  @IsDateString()
  @Validate(IsValidFromAndValidUntil)
  validUntil?: string;
}

class PutBodyAttributeDTO {
  @ApiProperty({
    enum: Category,
    description: "共有資源カテゴリ名",
  })
  @IsNotEmpty()
  @IsIn(Object.values(Category))
  @IsString()
  category: string;

  @ApiProperty({
    description: "共有資源状態配列",
    type: [PutBodyStatusDTO],
  })
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PutBodyStatusDTO)
  statuses: PutBodyStatusDTO[];
}

export class SharedResourcesPutBodyDTO {
  @ApiProperty({
    enum: DATAMODEL_TYPE,
    description: 'Enum: "test1" "test2"',
  })
  @IsNotEmpty()
  @IsIn(Object.values(DATAMODEL_TYPE))
  @IsString()
  dataModelType: string;

  @ApiProperty()
  @ValidateNested({ each: true })
  @IsNotEmpty()
  @Type(() => PutBodyAttributeDTO)
  attribute: PutBodyAttributeDTO;
}
