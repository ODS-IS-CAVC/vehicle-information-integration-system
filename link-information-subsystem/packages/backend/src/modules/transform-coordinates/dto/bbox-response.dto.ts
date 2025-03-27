import { ApiPropertyOptional } from "@nestjs/swagger";

/** C-2-2[B] バウンディングボックス（矩形領域座標)データモデル取得のレスポンス */
export class BBoxResponseDTO {
  @ApiPropertyOptional({
    description: "バウンディングボックス",
    type: () => [Number],
  })
  bbox: number[];
}
