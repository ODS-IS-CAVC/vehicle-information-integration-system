import { Controller, Get, InternalServerErrorException, NotFoundException, Query } from "@nestjs/common";
import {
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { FileAttributesService } from "./file-attributes.service";
import { GetResultFileAttributesResponseDto } from "./dto/file-attributes-response.dto";
import {
  INTERNAL_SERVER_ERROR_MESSAGE,
  NOT_FOUND_MESSAGE,
  BAD_REQUEST_MESSAGE,
  UNAUTHORIZED_ERROR_MESSAGE,
} from "src/consts/openapi.const";
import { GetFileAttributesQueryDto } from "./dto/file-attributes-query.dto";

import { Roles } from "../shares/role/role.guard";

@Roles("user")
@ApiTags("C-2-2[B] 車両情報連携システム")
@Controller()
export class FileAttributesController {
  constructor(private readonly service: FileAttributesService) {}

  /**
   * ファイル属性データモデル取得
   * @param {GetFileAttributesQueryDto} condition - リクエストクエリ
   * @returns ファイル属性データモデル
   */
  @Get("/fileattributes")
  @ApiOperation({ summary: "C-2-2[B] ファイル属性データモデル取得", description: "ファイル属性データモデルのデータを取得します。" })
  @ApiResponse({ status: 200, description: "OK", type: GetResultFileAttributesResponseDto })
  @ApiBadRequestResponse({ description: BAD_REQUEST_MESSAGE })
  @ApiNotFoundResponse({ description: NOT_FOUND_MESSAGE })
  @ApiInternalServerErrorResponse({ description: INTERNAL_SERVER_ERROR_MESSAGE })
  @ApiUnauthorizedResponse({ description: UNAUTHORIZED_ERROR_MESSAGE })
  async getFileAttributes(@Query() condition: GetFileAttributesQueryDto) {
    try {
      const pointCloudDlUrl = await this.service.getFileAttributes(condition);
      return pointCloudDlUrl;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else if (error instanceof Error) {
        throw new InternalServerErrorException();
      }
    }
  }
}
