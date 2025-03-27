import { BadRequestException, Controller, Get, InternalServerErrorException, Query, UnprocessableEntityException } from "@nestjs/common";
import { VoxelsQueryDTO } from "./dto/voxels-query.dto";
import { LineStringsQueryDTO } from "./dto/line-string-query.dto";
import { BBoxQueryDTO } from "./dto/bbox-query.dto";
import { TransformCoordinatesService } from "./transform-coordinates.service";
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { ZFXYTile } from "src/ouranos-gex-lib/src/zfxy";
import { Line, Point } from "src/type/coordinates";
import { voxelsResponseDTO } from "./dto/voxels-response.dto";
import { LineStringsResponseDTO } from "./dto/line-string-response.dto";
import { BBoxResponseDTO } from "./dto/bbox-response.dto";
import {
  BAD_REQUEST_MESSAGE,
  INTERNAL_SERVER_ERROR_MESSAGE,
  UNAUTHORIZED_ERROR_MESSAGE,
  UNPROCESSABLE_ENTITY_RESPONSE_MESSAGE,
} from "src/consts/openapi.const";
import { Roles } from "../shares/role/role.guard";

@Roles("user")
@ApiTags("C-2-2[B] 車両情報連携システム（データ流通システム取扱対象外）")
@Controller()
export class TransformCoordinatesController {
  constructor(private readonly service: TransformCoordinatesService) {}

  /**
   * 座標変換_空間ID列データモデル取得
   * @param query bbox, mesh, cityのいずれかが含む
   * @returns 空間ID
   */
  @Get("/voxels")
  @ApiOperation({ summary: "C-2-2[B] 空間ID列データモデル取得", description: "対応する空間ID列を取得します。" })
  @ApiResponse({ status: 200, description: "OK", type: voxelsResponseDTO })
  @ApiUnauthorizedResponse({ description: UNAUTHORIZED_ERROR_MESSAGE })
  @ApiBadRequestResponse({ description: BAD_REQUEST_MESSAGE })
  @ApiUnprocessableEntityResponse({ description: UNPROCESSABLE_ENTITY_RESPONSE_MESSAGE })
  @ApiInternalServerErrorResponse({ description: INTERNAL_SERVER_ERROR_MESSAGE })
  async getVoxels(@Query() query: VoxelsQueryDTO): Promise<ZFXYTile[]> {
    try {
      const voxels = await this.service.getVoxels(query);
      return voxels;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      } else if (error instanceof UnprocessableEntityException) {
        throw error;
      } else if (error instanceof Error) {
        throw new InternalServerErrorException();
      }
    }
  }

  /**
   * 座標変換_座標列(LineString)取得
   * @param query 2地点の空間ID
   * @returns LineString
   */
  @Get("/coordinates")
  @ApiOperation({ summary: "C-2-2[B] 座標列(LineString)データモデル取得", description: "対応する座標列(LineString)を取得します。" })
  @ApiOkResponse({ status: 200, description: "OK", type: LineStringsResponseDTO })
  @ApiUnauthorizedResponse({ description: UNAUTHORIZED_ERROR_MESSAGE })
  @ApiBadRequestResponse({ description: BAD_REQUEST_MESSAGE })
  @ApiInternalServerErrorResponse({ description: INTERNAL_SERVER_ERROR_MESSAGE })
  async getCoordinates(@Query() query: LineStringsQueryDTO): Promise<Line[] | Point[]> {
    try {
      const lines = await this.service.getLineString(query);
      return lines;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      } else if (error instanceof Error) {
        throw new InternalServerErrorException();
      }
    }
  }

  /**
   * 座標変換_バウンディングボックスデータモデル取得
   * @param query voxel, mesh, cityのいずれか含む
   * @returns bbox
   */
  @Get("/bbox")
  @ApiOperation({
    summary: "C-2-2[B] バウンディングボックス（矩形領域座標)データモデル取得。",
    description: "対応するバウンディングボックスを取得します。",
  })
  @ApiResponse({ status: 200, description: "OK", type: BBoxResponseDTO })
  @ApiUnauthorizedResponse({ description: UNAUTHORIZED_ERROR_MESSAGE })
  @ApiBadRequestResponse({ description: BAD_REQUEST_MESSAGE })
  @ApiUnprocessableEntityResponse({ description: UNPROCESSABLE_ENTITY_RESPONSE_MESSAGE })
  @ApiInternalServerErrorResponse({ description: INTERNAL_SERVER_ERROR_MESSAGE })
  async getBBox(@Query() query: BBoxQueryDTO): Promise<number[]> {
    try {
      const bbox = await this.service.getBBox(query);
      return bbox;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      } else if (error instanceof UnprocessableEntityException) {
        throw error;
      } else if (error instanceof Error) {
        throw new InternalServerErrorException();
      }
    }
  }
}
