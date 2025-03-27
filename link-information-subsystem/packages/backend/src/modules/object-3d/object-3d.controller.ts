import {
  Controller,
  Get,
  Put,
  Body,
  Query,
  Delete,
  InternalServerErrorException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import {
  ApiBody,
  ApiInternalServerErrorResponse,
  ApiBadRequestResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiConflictResponse,
} from "@nestjs/swagger";
import { Object3dService } from "./object-3d.service";
import {
  Object3dResponseDTO,
  GetResult3dObjectUpUrlResponseDto,
  PutResultObjectOperationResponseDto,
  ObjectOperationResponseDto,
  DeleteResultObjectOperationResponseDto,
  PutResultObjectOperationTitleResponseDto,
} from "./dto/object-3d-response.dto";
import {
  INTERNAL_SERVER_ERROR_MESSAGE,
  BAD_REQUEST_MESSAGE,
  UNAUTHORIZED_ERROR_MESSAGE,
  CONFLICT_RESPONSE_MESSAGE,
} from "src/consts/openapi.const";
import { PutObjectOperationBodyDto, PutObjectOperationTitleBodyDto } from "./dto/object-3d-body.dto";
import { DeleteObjectOperationQueryDto, GetObjectOperationQueryDto, GetObjectUpUrlQueryDto } from "./dto/object-3d-query.dto";
import { Roles } from "../shares/role/role.guard";

@Roles("user")
@ApiTags("C-2-2[B] 車両情報連携システム（データ流通システム取扱対象外）")
@Controller()
export class Object3dController {
  constructor(private readonly service: Object3dService) {}
  /**
   * 3Dオブジェクト一覧取得
   * @param
   * @returns
   */
  @Get("/3dObject")
  @ApiOperation({ summary: "C-2-2[B] 3Dオブジェクト一覧取得", description: "3Dオブジェクト一覧を取得します。" })
  @ApiResponse({ status: 200, description: "OK", type: [Object3dResponseDTO] })
  @ApiInternalServerErrorResponse({ description: INTERNAL_SERVER_ERROR_MESSAGE })
  @ApiUnauthorizedResponse({ description: UNAUTHORIZED_ERROR_MESSAGE })
  async get3dObjectList() {
    try {
      const object3dList = await this.service.get3dObjectList();
      return object3dList;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  /**
   * 3Dオブジェクトアップロード用URL取得
   * @param targetFile 3dobjectfile
   * @returns
   */
  @Get("/3dObjectUpUrl")
  @ApiOperation({ summary: "3Dオブジェクトアップロード用URL取得", description: "3Dオブジェクトアップロード用URLを取得します。" })
  @ApiResponse({ status: 200, description: "OK", type: GetResult3dObjectUpUrlResponseDto })
  @ApiConflictResponse({ description: CONFLICT_RESPONSE_MESSAGE })
  @ApiBadRequestResponse({ description: BAD_REQUEST_MESSAGE })
  @ApiInternalServerErrorResponse({ description: INTERNAL_SERVER_ERROR_MESSAGE })
  @ApiUnauthorizedResponse({ description: UNAUTHORIZED_ERROR_MESSAGE })
  async get3dObjectUpUrl(@Query() condition: GetObjectUpUrlQueryDto) {
    try {
      const url = await this.service.get3dObjectUpUrl(condition.filename);
      return url;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      } else if (error instanceof BadRequestException) {
        throw error;
      } else if (error instanceof Error) {
        throw new InternalServerErrorException();
      }
    }
  }
  /**
   * 3Dオブジェクト操作結果一覧取得
   * @param pointCloudUniqueId 点群ID
   * @returns 3Dオブジェクト操作結果一覧
   */
  @Get("/objectOperation")
  @ApiOperation({ summary: "C-2-2[B] 3Dオブジェクト操作結果一覧取得", description: "3Dオブジェクト操作結果一覧を取得します。" })
  @ApiResponse({ status: 200, description: "OK", type: [ObjectOperationResponseDto] })
  @ApiInternalServerErrorResponse({ description: INTERNAL_SERVER_ERROR_MESSAGE })
  @ApiBadRequestResponse({ description: BAD_REQUEST_MESSAGE })
  @ApiUnauthorizedResponse({ description: UNAUTHORIZED_ERROR_MESSAGE })
  async getObjectOperationList(@Query() condition: GetObjectOperationQueryDto) {
    try {
      const objectOperationList = await this.service.getObjectOperationList(condition);
      return objectOperationList;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }
  /**
   * 3Dオブジェクト操作結果登録
   * @param operationId 操作結果ID
   * @param title タイトル
   * @param pointCloudUniqueId 点群ID
   * @param object3dId 3DオブジェクトID
   * @param putCoordinates potree座標情報
   * @param xRotation x方向回転量
   * @param yRotation y方向回転量
   * @param zRotation z方向回転量
   * @param scale 拡大・縮小率
   * @returns 登録結果
   */
  @Put("/objectOperation")
  @ApiBody({ type: PutObjectOperationBodyDto })
  @ApiOperation({ summary: "C-2-2[B] 3Dオブジェクト操作結果登録", description: "3Dオブジェクト操作結果を登録します。" })
  @ApiResponse({ status: 200, description: "OK", type: PutResultObjectOperationResponseDto })
  @ApiConflictResponse({ description: CONFLICT_RESPONSE_MESSAGE })
  @ApiInternalServerErrorResponse({ description: INTERNAL_SERVER_ERROR_MESSAGE })
  @ApiBadRequestResponse({ description: BAD_REQUEST_MESSAGE })
  @ApiUnauthorizedResponse({ description: UNAUTHORIZED_ERROR_MESSAGE })
  async put3dOperation(@Body() condition: PutObjectOperationBodyDto) {
    try {
      const result = await this.service.put3dOperation(condition);
      return result;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      } else if (error instanceof Error) {
        throw new InternalServerErrorException();
      }
    }
  }

  /**
   * 3Dオブジェクト操作結果タイトル変更
   * @param operationId 操作結果ID
   * @returns 登録結果
   */
  @Put("/objectOperationTitle")
  @ApiBody({ type: PutObjectOperationTitleBodyDto })
  @ApiOperation({ summary: "3Dオブジェクト操作結果タイトル変更", description: "3Dオブジェクト操作結果のタイトルを変更します。" })
  @ApiResponse({ status: 200, description: "OK", type: PutResultObjectOperationTitleResponseDto })
  @ApiConflictResponse({ description: CONFLICT_RESPONSE_MESSAGE })
  @ApiInternalServerErrorResponse({ description: INTERNAL_SERVER_ERROR_MESSAGE })
  @ApiBadRequestResponse({ description: BAD_REQUEST_MESSAGE })
  @ApiUnauthorizedResponse({ description: UNAUTHORIZED_ERROR_MESSAGE })
  async put3dOperationTitle(@Body() condition: PutObjectOperationTitleBodyDto) {
    try {
      const result = await this.service.put3dOperationTitle(condition);
      return result;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      } else if (error instanceof Error) {
        throw new InternalServerErrorException();
      }
    }
  }

  /**
   * 3Dオブジェクト操作結果削除
   * @param operationId 操作結果ID
   * @returns 削除結果
   */
  @Delete("/objectOperation")
  @ApiOperation({ summary: "3Dオブジェクト操作結果削除", description: "3Dオブジェクト操作結果を削除します。" })
  @ApiResponse({ status: 200, description: "OK", type: DeleteResultObjectOperationResponseDto })
  @ApiInternalServerErrorResponse({ description: INTERNAL_SERVER_ERROR_MESSAGE })
  @ApiBadRequestResponse({ description: BAD_REQUEST_MESSAGE })
  @ApiUnauthorizedResponse({ description: UNAUTHORIZED_ERROR_MESSAGE })
  async delete3dOperation(@Query() condition: DeleteObjectOperationQueryDto) {
    try {
      const result = await this.service.delete3dOperation(condition);
      return result;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }
}
