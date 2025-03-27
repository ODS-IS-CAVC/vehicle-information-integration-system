import { ApiProperty } from "@nestjs/swagger";

class Facade {
  @ApiProperty({
    description: "URL",
    format: "string",
  })
  url: string;
}

export class FacadeResponseDto {
  @ApiProperty({
    description: "dataModelType test1固定値を設定",
    format: "string",
  })
  dataModelType: string;
  @ApiProperty({
    description: "attribute",
    format: "直接アクセス・ポイント情報",
  })
  attribute: Facade;
}
