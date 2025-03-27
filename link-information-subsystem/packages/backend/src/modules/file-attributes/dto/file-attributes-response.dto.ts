import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Position } from "geojson";

class FileAttributes {
  @ApiPropertyOptional({
    description: "ファイル名",
    format: "string",
  })
  fileName: string;
  @ApiPropertyOptional({
    description: "ファイル種別 potreeまたはlazを設定",
    format: "string",
  })
  type: string;
  @ApiPropertyOptional({
    description: "ファイルサイズ（バイト）",
    format: "int32",
  })
  size: number;
  @ApiPropertyOptional({
    description: "作成日時 2024-10-21T00:42:00.000Z",
    format: "string",
  })
  created: string;
  @ApiPropertyOptional({
    description: "ジオメトリ情報",
    type: "array",
    items: { type: "array", items: { type: "number" } },
  })
  coordinates: Position[];
}

export class GetResultFileAttributesResponseDto {
  @ApiProperty({
    description: "dataModelType test1固定値を設定",
    format: "string",
  })
  dataModelType: string;
  @ApiProperty({
    description: "attribute",
    format: "ファイル属性オブジェクト",
  })
  attribute: FileAttributes;
}
