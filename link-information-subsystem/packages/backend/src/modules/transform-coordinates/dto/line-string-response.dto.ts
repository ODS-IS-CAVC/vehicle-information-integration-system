import { LineInfo, PointInfo } from "src/modules/shares/point-info";
import { ApiPropertyOptional, getSchemaPath } from "@nestjs/swagger";

/** C-2-2[B] 座標列(LineString)データモデル取得のレスポンス */
export class LineStringsResponseDTO {
  @ApiPropertyOptional({
    description: "LineString",
    oneOf: [{ $ref: getSchemaPath(PointInfo) }, { $ref: getSchemaPath(LineInfo) }],
  })
  lines: { lat: number; lon: number }[] | { lat: number; lon: number }[][];
}
