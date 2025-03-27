import { Body, Controller, Delete, InternalServerErrorException, NotFoundException, Put, Query } from "@nestjs/common";
import { ResourcesService } from "./resources.service";
import { ENDPOINT } from "src/consts/endpoint.const";
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiProduces,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { BAD_REQUEST_MESSAGE, INTERNAL_SERVER_ERROR_MESSAGE, UNAUTHORIZED_ERROR_MESSAGE } from "src/consts/openapi.const";
import { Roles } from "../shares/role/role.guard";
import { SharedResourcesDeleteResponseDTO } from "./dto/resources-delete-response.dto";
import { SharedResourcesPutBodyDTO } from "./dto/resources-put-body.dto";
import { SharedResourcesDeleteBodyDTO } from "./dto/resources-delete-body.dto";
import { SharedResourcesPutResponseDTO } from "./dto/resources-put-response.dto";

@Roles("user")
@ApiTags("C-2-2[B] 車両情報連携システム")
@Controller()
export class ResourcesController {
  constructor(private readonly service: ResourcesService) {}
  /**
   * 共有資源状態データモデル設定
   * @param {SharedResourcesPutBodyDTO} condition - リクエストボディ
   * @returns {Promise<SharedResourcesPutResponseDTO>} - レスポンス
   * @throws {Error} - データの挿入に失敗
   */
  @Put(`/${ENDPOINT.SHARE_RESOURCES}`)
  @ApiOperation({
    summary: "C-2-2[B] 共有資源状態データモデル設定",
    description: "共有資源状態データモデルのデータを設定します。指定カテゴリの共有資源状態を設定します。",
  })
  @ApiProduces("application/json")
  @ApiResponse({
    status: 200,
    description: "OK",
    type: SharedResourcesPutResponseDTO,
  })
  @ApiBadRequestResponse({ description: BAD_REQUEST_MESSAGE })
  @ApiUnauthorizedResponse({ description: UNAUTHORIZED_ERROR_MESSAGE })
  @ApiInternalServerErrorResponse({ description: INTERNAL_SERVER_ERROR_MESSAGE })
  async putSharedResources(@Body() condition: SharedResourcesPutBodyDTO): Promise<SharedResourcesPutResponseDTO> {
    const result = await this.service.putSharedResources(condition);
    return result;
  }
  /**
   * 共有資源状態データモデル削除
   * @param {SharedResourcesDeleteBodyDTO} condition - リクエストボディ
   * @returns {Promise<SharedResourcesDeleteResponseDTO>} - レスポンス
   * @throws {Error} - データの削除に失敗
   */
  @Delete(`/${ENDPOINT.SHARE_RESOURCES}`)
  @ApiOperation({ summary: "C-2-2[B] 共有資源状態データモデル削除", description: "共有資源状態データモデルのデータを削除します。" })
  @ApiProduces("application/json")
  @ApiResponse({
    status: 200,
    description: "OK",
    type: SharedResourcesDeleteResponseDTO,
  })
  @ApiBadRequestResponse({ description: BAD_REQUEST_MESSAGE })
  @ApiUnauthorizedResponse({ description: UNAUTHORIZED_ERROR_MESSAGE })
  @ApiInternalServerErrorResponse({ description: INTERNAL_SERVER_ERROR_MESSAGE })
  async deleteSharedResources(@Query() condition: SharedResourcesDeleteBodyDTO): Promise<SharedResourcesDeleteResponseDTO> {
    try {
      const result = await this.service.deleteSharedResources(condition);
      return result;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else if (error instanceof Error) {
        throw new InternalServerErrorException();
      }
    }
  }
}
