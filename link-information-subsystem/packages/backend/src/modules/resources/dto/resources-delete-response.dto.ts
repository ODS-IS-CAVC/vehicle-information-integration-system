import { ApiProperty } from "@nestjs/swagger";
export class SharedResourcesDeleteResponseDTO {
  @ApiProperty({
    description: "共有資源状態削除結果",
    example: "SUCCESS",
  })
  result: string;
}
