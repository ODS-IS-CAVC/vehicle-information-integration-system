import { IsDateString, IsIn, IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { DATAMODEL_TYPE } from "src/consts/datamodel-type.const";
import { Category } from "src/consts/resource.const";

export class SharedResourcesPutValueDTO {
  @ApiProperty({
    enum: DATAMODEL_TYPE,
    description: 'Enum: "test1" "test2"',
  })
  @IsNotEmpty()
  @IsIn(Object.values(DATAMODEL_TYPE))
  @IsString()
  dataModelType: string;

  @ApiProperty({
    enum: Category,
    description: "共有資源カテゴリ名",
  })
  @IsNotEmpty()
  @IsIn(Object.values(Category))
  @IsString()
  category: string;

  @ApiProperty({
    description:
      "MH予約ID。文字クラス[-_A-Za-z]の文字列で、「システム予約識別子」と\n\n" + "「駐車マス識別子」を、文字「-」で繋いだ文字列。",
    example: "A0JYEyM3-21453354856",
  })
  @IsNotEmpty()
  @IsString()
  key: string;

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
  validFrom: string;

  @ApiProperty({
    description:
      "予約終了希望時刻（排他）。\n\n" +
      "予約終了希望時刻の指定が無い場合、予約開始希望時刻から\n\n" +
      "一時間後が自動登録される。有効期限切れデータは自動消去される。",
  })
  @IsNotEmpty()
  @IsDateString()
  validTo: string;
}
