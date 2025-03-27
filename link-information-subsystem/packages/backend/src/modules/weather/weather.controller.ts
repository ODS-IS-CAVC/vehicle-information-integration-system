import { BadRequestException, Controller, Get, InternalServerErrorException, Query, UnprocessableEntityException } from "@nestjs/common";
import {
  ApiInternalServerErrorResponse,
  ApiBadRequestResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { WeatherService } from "./weather.service";
import { GetWeatherRiskResponseDto } from "./dto/weather-response.dto";
import {
  INTERNAL_SERVER_ERROR_MESSAGE,
  BAD_REQUEST_MESSAGE,
  UNAUTHORIZED_ERROR_MESSAGE,
  UNPROCESSABLE_ENTITY_RESPONSE_MESSAGE,
} from "src/consts/openapi.const";
import { WeatherListQueryDto } from "./dto/weather-query.dto";
import { Roles } from "../shares/role/role.guard";

@Roles("user")
@ApiTags("C-2-2[B] 車両情報連携システム（データ流通システム取扱対象外）")
@Controller()
export class WeatherController {
  constructor(private readonly service: WeatherService) {}

  /**
   * 気象リスクデータモデル取得
   * @param {WeatherListQueryDto} condition - リクエストクエリ
   * @returns 気象リスクデータモデル
   */
  @Get("/weatherrisk")
  @ApiOperation({ summary: "C-2-2[B] 気象リスクデータモデル取得", description: "気象リスクデータモデルのデータを取得します。" })
  @ApiResponse({ status: 200, description: "OK", type: [GetWeatherRiskResponseDto] })
  @ApiBadRequestResponse({ description: BAD_REQUEST_MESSAGE })
  @ApiUnprocessableEntityResponse({ description: UNPROCESSABLE_ENTITY_RESPONSE_MESSAGE })
  @ApiInternalServerErrorResponse({ description: INTERNAL_SERVER_ERROR_MESSAGE })
  @ApiUnauthorizedResponse({ description: UNAUTHORIZED_ERROR_MESSAGE })
  async getWeatherRisk(@Query() condition: WeatherListQueryDto) {
    try {
      const weatherRisk = await this.service.getWeatherRisk(condition);
      return weatherRisk;
    } catch (error) {
      if (error instanceof UnprocessableEntityException) {
        throw error;
      } else if (error instanceof BadRequestException) {
        throw error;
      } else if (error instanceof Error) {
        throw new InternalServerErrorException();
      }
    }
  }
}
