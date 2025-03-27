import { ApiPropertyOptional } from "@nestjs/swagger";

export class PointInfo {
  @ApiPropertyOptional({ description: "緯度" })
  lat: number;

  @ApiPropertyOptional({ description: "経度" })
  lon: number;
}

export class LineInfo {
  @ApiPropertyOptional({ description: "point", type: () => [PointInfo] })
  lines?: PointInfo[];
}
