import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class VoxelInfo {
  @ApiProperty({
    description: "x（東西方向）インデックス",
  })
  x: number;

  @ApiProperty({
    description: "y（南北方向）インデックス",
  })
  y: number;

  @ApiProperty({
    description: "z ズームレベル",
  })
  z: number;

  @ApiPropertyOptional({
    description: "f（鉛直方向）インデックス",
  })
  f: number;
}
