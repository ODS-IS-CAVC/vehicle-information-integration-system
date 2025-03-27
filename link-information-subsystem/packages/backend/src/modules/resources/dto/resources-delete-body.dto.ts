import { IsNotEmpty, IsString } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

// 共有資源削除リクエストボディ
export class SharedResourcesDeleteBodyDTO {
  @ApiPropertyOptional({
    description: "キャンセルする予約ID",
    type: "string",
    example: "A0JYEyM3-21453354856",
  })
  @IsNotEmpty()
  @IsString()
  keyFilter: string;
}
