import { ApiPropertyOptional } from "@nestjs/swagger";
import { VoxelInfo } from "src/modules/shares/voxel-info";
import { ZFXYTile } from "src/ouranos-gex-lib/dist/zfxy";

/* C-2-2[B] 空間ID列データモデル取得APIのレスポンス */
export class voxelsResponseDTO {
  @ApiPropertyOptional({
    description: "空間ID",
    type: () => [VoxelInfo],
  })
  voxels: ZFXYTile[];
}
