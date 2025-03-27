import {
  Controller,
  Get,
  Put,
  Body,
  Query,
  Delete,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  ApiBody,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { PointCloudService } from "./point-cloud.service";
import {
  PutResultPointCloudSplitResponseDto,
  GetResultPointCloudDlUrlResponseDto,
  GetResultPointCloudSplitStatusResponseDto,
  DeleteResultPointCloudSplitResponseDto,
  GetResultPointCloudListResponseDto,
} from "./dto/point-cloud-response.dto";
import {
  INTERNAL_SERVER_ERROR_MESSAGE,
  NOT_FOUND_MESSAGE,
  BAD_REQUEST_MESSAGE,
  UNAUTHORIZED_ERROR_MESSAGE,
  UNPROCESSABLE_ENTITY_RESPONSE_MESSAGE,
} from "src/consts/openapi.const";
import { PutPointCloudSplitBodyDto } from "./dto/point-cloud-body.dto";
import { DeletePointCloudSplitQueryDto, GetPointCloudDlUrlQueryDto, GetPointCloudListQueryDto } from "./dto/point-cloud-query.dto";

import { Roles } from "../shares/role/role.guard";
import { CurrentUser } from "../shares/role/role.decorator";
import { Users } from "src/entities/share/users.entity";

@Roles("user")
@ApiTags("C-2-2[B] 車両情報連携システム（データ流通システム取扱対象外）")
@Controller()
export class PointCloudController {
  constructor(private readonly service: PointCloudService) {}

  /**
   * 点群データ一覧取得
   * @param {GetPointCloudListQueryDto} condition - リクエストクエリ
   * @returns 点群データ一覧
   */
  @Get("/pointCloudList")
  @ApiOperation({ summary: "C-2-2[B] 点群データ一覧取得", description: "点群データ一覧を取得します。" })
  @ApiResponse({ status: 200, description: "OK", type: GetResultPointCloudListResponseDto })
  @ApiBadRequestResponse({ description: BAD_REQUEST_MESSAGE })
  @ApiUnprocessableEntityResponse({ description: UNPROCESSABLE_ENTITY_RESPONSE_MESSAGE })
  @ApiInternalServerErrorResponse({ description: INTERNAL_SERVER_ERROR_MESSAGE })
  @ApiUnauthorizedResponse({ description: UNAUTHORIZED_ERROR_MESSAGE })
  async getPointcloudList(@Query() condition: GetPointCloudListQueryDto) {
    try {
      const pointcloudList = await this.service.getPointcloudList(condition);
      return pointcloudList;
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
   * 点群データ分割(切出)処理状況取得
   * @param pointCloudUniqueId 点群ID
   * @returns 点群データ分割(切出)処理状況
   */
  @Get("/pointCloudSplitStatus")
  @ApiOperation({ summary: "C-2-2[B] 点群データ分割(切出)処理状況取得", description: "点群データ分割(切出)処理状況を取得します。" })
  @ApiResponse({ status: 200, description: "OK", type: [GetResultPointCloudSplitStatusResponseDto] })
  @ApiInternalServerErrorResponse({ description: INTERNAL_SERVER_ERROR_MESSAGE })
  @ApiBadRequestResponse({ description: BAD_REQUEST_MESSAGE })
  @ApiUnauthorizedResponse({ description: UNAUTHORIZED_ERROR_MESSAGE })
  async getPointcloudSplitStatus(@CurrentUser() user: Users) {
    try {
      const pointcloudSplitStatus = await this.service.getPointcloudSplitStatus(user);
      return pointcloudSplitStatus;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  /**
   * 分割済み点群データダウンロードURL取得
   * @param requestId 分割申請ID
   * @returns 分割済み点群データダウンロードURL
   */
  @Get("/pointCloudDlUrl")
  @ApiOperation({
    summary: "C-2-2[B] 分割済み点群データダウンロードURL取得",
    description: "分割済み点群データダウンロードURLを取得します。",
  })
  @ApiResponse({ status: 200, description: "OK", type: GetResultPointCloudDlUrlResponseDto })
  @ApiNotFoundResponse({ description: NOT_FOUND_MESSAGE })
  @ApiInternalServerErrorResponse({ description: INTERNAL_SERVER_ERROR_MESSAGE })
  @ApiBadRequestResponse({ description: BAD_REQUEST_MESSAGE })
  @ApiUnauthorizedResponse({ description: UNAUTHORIZED_ERROR_MESSAGE })
  async getPointcloudDlUrl(@Query() condition: GetPointCloudDlUrlQueryDto) {
    try {
      const pointCloudDlUrl = await this.service.getPointcloudDlUrl(condition);
      return pointCloudDlUrl;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else if (error instanceof Error) {
        throw new InternalServerErrorException();
      }
    }
  }

  /**
   * 点群データ分割(切出)申請
   * @param startPoint 始点
   * @param endPoint 終点
   * @param pointCloudUniqueId 点群ID
   * @returns 登録結果
   */
  @Put("/pointCloudSplit")
  @ApiBody({ type: PutPointCloudSplitBodyDto })
  @ApiOperation({ summary: "C-2-2[B] 点群データ分割(切出)申請", description: "点群データ分割(切出)申請を行います。" })
  @ApiResponse({ status: 200, description: "OK", type: PutResultPointCloudSplitResponseDto })
  @ApiNotFoundResponse({ description: NOT_FOUND_MESSAGE })
  @ApiInternalServerErrorResponse({ description: INTERNAL_SERVER_ERROR_MESSAGE })
  @ApiBadRequestResponse({ description: BAD_REQUEST_MESSAGE })
  @ApiUnauthorizedResponse({ description: UNAUTHORIZED_ERROR_MESSAGE })
  async putPointCloudSplit(@Body() condition: PutPointCloudSplitBodyDto, @CurrentUser() user: Users) {
    try {
      const result = await this.service.putPointCloudSplit(condition, user);
      return result;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      } else if (error instanceof NotFoundException) {
        throw error;
      } else if (error instanceof Error) {
        throw new InternalServerErrorException();
      }
    }
  }
  /**
   * 分割後点群データ削除
   * @param operationId 分割申請ID
   * @returns 削除結果
   */
  @Delete("/pointCloudSplitFile")
  @ApiOperation({ summary: "分割後点群データ削除", description: "分割後点群データを削除します。" })
  @ApiResponse({ status: 200, description: "OK", type: DeleteResultPointCloudSplitResponseDto })
  @ApiNotFoundResponse({ description: NOT_FOUND_MESSAGE })
  @ApiInternalServerErrorResponse({ description: INTERNAL_SERVER_ERROR_MESSAGE })
  @ApiBadRequestResponse({ description: BAD_REQUEST_MESSAGE })
  @ApiUnauthorizedResponse({ description: UNAUTHORIZED_ERROR_MESSAGE })
  async deletePointcloudSplitFile(@Query() condition: DeletePointCloudSplitQueryDto) {
    try {
      const result = await this.service.deletePointcloudSplitFile(condition);
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
