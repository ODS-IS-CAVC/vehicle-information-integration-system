import {
  BadRequestException,
  Controller,
  Get,
  InternalServerErrorException,
  Param,
  Query,
  Res,
  UnprocessableEntityException,
} from "@nestjs/common";
import { Response } from "express";
import {
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiProduces,
  ApiResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { ENDPOINT } from "../../consts/endpoint.const";
import { MAP_SOURCE } from "../../consts/map.const";
import { RoadHdLaneCenterProperties } from "./dto/road-hd-lane-center-properties";
import { RoadHdLaneLineProperties } from "./dto/road-hd-lane-line-properties";
import { RoadHdRoadEdgeProperties } from "./dto/road-hd-road-edge-properties";
import { RoadHdIIntersectionProperties } from "./dto/road-hd-intersection-properties";
import { RoadHdPavementMarkingProperties } from "./dto/road-hd-road-pavement-marking-properties";
import { RoadHdSignProperties } from "./dto/road-hd-sign-properties";
import { RoadTrafficProperties } from "./dto/road-traffic-properties";
import { RoadTripTimeProperties } from "./dto/road-trip-time-properties";
import { RoadEntryExitProperties } from "./dto/road-entry-exit-properties";
import {
  RoadHdLaneCenterGetResponse,
  RoadHdLaneLineGetResponse,
  RoadHdRoadEdgeGetResponse,
  RoadHdIntersectionLineGetResponse,
  RoadHdPavementMarkingGetResponse,
  RoadHdSignGetResponse,
  RoadPBFGetParamDTO,
  RoadPBFGetQueryDTO,
  CommonRoadGeoJSONGetQueryDTO,
  HdLaneCenterGeoJSONGetQueryDTO,
  RoadHdTrafficGetResponse,
  CommonRoadGeoJSONGetWithoutTimestampQueryDTO,
  RoadTripTimeGetResponse,
  RoadEntryExitGetResponse,
  RoadConstructionEventGetResponse,
  RoadWinterClosureGetResponse,
  RoadGeoJSONWithTimestampGetQueryDTO,
  RoadExtraTrafficGetParamDTO,
} from "./dto/road.dto";
import { RoadService } from "./road.service";
import {
  BAD_REQUEST_MESSAGE,
  UNAUTHORIZED_ERROR_MESSAGE,
  INTERNAL_SERVER_ERROR_MESSAGE,
  UNPROCESSABLE_ENTITY_RESPONSE_MESSAGE,
} from "src/consts/openapi.const";
import { PBF } from "../shares/pbf/pbf";
import { Roles } from "../shares/role/role.guard";
import { RoadConstructionEventProperties } from "./dto/road-construction-event-properties";
import { RoadWinterClosureProperties } from "./dto/road-winter-closure-properties";
import { LoggerService } from "../util/logger/logger.service";
@Roles("user")
@ApiTags("C-2-2[B] 車両情報連携システム（データ流通システム取扱対象外）")
@Controller()
export class RoadController {
  constructor(
    private readonly service: RoadService,
    private readonly loggerService: LoggerService,
  ) {}

  @Get(`/${ENDPOINT.HD_LANE_CENTER}`)
  @ApiOperation({
    summary: "C-2-2[B] HD地図車線中心線・交通規制情報データモデル取得",
    description: "HD地図車線中心線・静的交通規制情報データモデルのデータを取得します。",
  })
  @ApiProduces("application/json")
  @ApiResponse({
    status: 200,
    description: "OK",
    type: RoadHdLaneCenterGetResponse,
  })
  @ApiBadRequestResponse({ description: BAD_REQUEST_MESSAGE })
  @ApiUnauthorizedResponse({ description: UNAUTHORIZED_ERROR_MESSAGE })
  @ApiUnprocessableEntityResponse({ description: UNPROCESSABLE_ENTITY_RESPONSE_MESSAGE })
  @ApiInternalServerErrorResponse({ description: INTERNAL_SERVER_ERROR_MESSAGE })
  async getHdLaneCenterGeoJSON(@Query() condition: HdLaneCenterGeoJSONGetQueryDTO): Promise<RoadHdLaneCenterGetResponse> {
    try {
      return this.service.getGeoJSON<RoadHdLaneCenterProperties>(MAP_SOURCE.HD_LANE_CENTER, condition);
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

  @Get(`/${ENDPOINT.HD_LANE_LINE}`)
  @ApiOperation({ summary: "C-2-2[B] HD地図区画線データモデル取得", description: "HD地図区画線データモデルのデータを取得します。" })
  @ApiProduces("application/json")
  @ApiResponse({
    status: 200,
    description: "OK",
    type: RoadHdLaneLineGetResponse,
  })
  @ApiBadRequestResponse({ description: BAD_REQUEST_MESSAGE })
  @ApiUnauthorizedResponse({ description: UNAUTHORIZED_ERROR_MESSAGE })
  @ApiUnprocessableEntityResponse({ description: UNPROCESSABLE_ENTITY_RESPONSE_MESSAGE })
  @ApiInternalServerErrorResponse({ description: INTERNAL_SERVER_ERROR_MESSAGE })
  async getHdLaneLineGeoJSON(@Query() condition: CommonRoadGeoJSONGetQueryDTO): Promise<RoadHdLaneLineGetResponse> {
    try {
      return this.service.getGeoJSON<RoadHdLaneLineProperties>(MAP_SOURCE.HD_LANE_LINE, condition);
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

  @Get(`/${ENDPOINT.HD_ROAD_EDGE}`)
  @ApiOperation({ summary: "C-2-2[B] HD地図道路縁データモデル取得", description: "HD地図道路縁データモデルのデータを取得します。" })
  @ApiProduces("application/json")
  @ApiResponse({
    status: 200,
    description: "OK",
    type: RoadHdRoadEdgeGetResponse,
  })
  @ApiBadRequestResponse({ description: BAD_REQUEST_MESSAGE })
  @ApiUnauthorizedResponse({ description: UNAUTHORIZED_ERROR_MESSAGE })
  @ApiUnprocessableEntityResponse({ description: UNPROCESSABLE_ENTITY_RESPONSE_MESSAGE })
  @ApiInternalServerErrorResponse({ description: INTERNAL_SERVER_ERROR_MESSAGE })
  async getHdRoadEdgeGeoJSON(@Query() condition: CommonRoadGeoJSONGetQueryDTO): Promise<RoadHdRoadEdgeGetResponse> {
    try {
      return this.service.getGeoJSON<RoadHdRoadEdgeProperties>(MAP_SOURCE.HD_ROAD_EDGE, condition);
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

  @Get(`/${ENDPOINT.HD_INTERSECTION}`)
  @ApiOperation({ summary: "C-2-2[B] HD地図交差点データモデル取得", description: "HD地図交差点データモデルのデータを取得します。" })
  @ApiProduces("application/json")
  @ApiResponse({
    status: 200,
    description: "OK",
    type: RoadHdIntersectionLineGetResponse,
  })
  @ApiBadRequestResponse({ description: BAD_REQUEST_MESSAGE })
  @ApiUnauthorizedResponse({ description: UNAUTHORIZED_ERROR_MESSAGE })
  @ApiUnprocessableEntityResponse({ description: UNPROCESSABLE_ENTITY_RESPONSE_MESSAGE })
  @ApiInternalServerErrorResponse({ description: INTERNAL_SERVER_ERROR_MESSAGE })
  async getHdIntersectionLineGeoJSON(@Query() condition: CommonRoadGeoJSONGetQueryDTO): Promise<RoadHdIntersectionLineGetResponse> {
    try {
      return this.service.getGeoJSON<RoadHdIIntersectionProperties>(MAP_SOURCE.HD_INTERSECTION, condition);
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

  @Get(`/${ENDPOINT.HD_PAVEMENT_MARKING}`)
  @ApiOperation({ summary: "C-2-2[B] HD地図路面標識データモデル取得", description: "HD地図路面標識データモデルのデータを取得します。" })
  @ApiProduces("application/json")
  @ApiResponse({
    status: 200,
    description: "OK",
    type: RoadHdPavementMarkingGetResponse,
  })
  @ApiBadRequestResponse({ description: BAD_REQUEST_MESSAGE })
  @ApiUnauthorizedResponse({ description: UNAUTHORIZED_ERROR_MESSAGE })
  @ApiUnprocessableEntityResponse({ description: UNPROCESSABLE_ENTITY_RESPONSE_MESSAGE })
  @ApiInternalServerErrorResponse({ description: INTERNAL_SERVER_ERROR_MESSAGE })
  async getHdPavementMarkingGeoJSON(@Query() condition: CommonRoadGeoJSONGetQueryDTO): Promise<RoadHdPavementMarkingGetResponse> {
    try {
      return this.service.getGeoJSON<RoadHdPavementMarkingProperties>(MAP_SOURCE.HD_PAVEMENT_MARKING, condition);
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

  @Get(`/${ENDPOINT.HD_SIGN}`)
  @ApiOperation({ summary: "C-2-2[B] HD地図道路標識データモデル取得", description: "HD地図道路標識データモデルのデータを取得します。" })
  @ApiProduces("application/json")
  @ApiResponse({
    status: 200,
    description: "OK",
    type: RoadHdSignGetResponse,
  })
  @ApiBadRequestResponse({ description: BAD_REQUEST_MESSAGE })
  @ApiUnauthorizedResponse({ description: UNAUTHORIZED_ERROR_MESSAGE })
  @ApiUnprocessableEntityResponse({ description: UNPROCESSABLE_ENTITY_RESPONSE_MESSAGE })
  @ApiInternalServerErrorResponse({ description: INTERNAL_SERVER_ERROR_MESSAGE })
  async getHdSignGeoJSON(@Query() condition: CommonRoadGeoJSONGetQueryDTO): Promise<RoadHdSignGetResponse> {
    try {
      return this.service.getGeoJSON<RoadHdSignProperties>(MAP_SOURCE.HD_SIGN, condition);
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

  @Get(`/${ENDPOINT.TRAFFIC}`)
  @ApiOperation({
    summary: "C-2-2[B] HD地図交通渋滞・規制情報データモデル取得",
    description: "交通渋滞・規制情報データモデルのデータを取得します。",
  })
  @ApiResponse({
    status: 200,
    description: "OK",
    type: RoadHdTrafficGetResponse,
  })
  @ApiBadRequestResponse({ description: BAD_REQUEST_MESSAGE })
  @ApiUnauthorizedResponse({ description: UNAUTHORIZED_ERROR_MESSAGE })
  @ApiUnprocessableEntityResponse({ description: UNPROCESSABLE_ENTITY_RESPONSE_MESSAGE })
  @ApiInternalServerErrorResponse({ description: INTERNAL_SERVER_ERROR_MESSAGE })
  async getHdTrafficGeoJSON(@Query() condition: CommonRoadGeoJSONGetWithoutTimestampQueryDTO): Promise<RoadHdTrafficGetResponse> {
    try {
      return this.service.getGeoJSON<RoadTrafficProperties>(MAP_SOURCE.TRAFFIC, condition);
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

  @Get(`/${ENDPOINT.TRAFFIC}/:roadSegmentId`)
  @ApiOperation({
    summary: "C-2-2[B] HD地図交通渋滞・規制情報データモデル取得",
    description: "交通渋滞・規制情報データモデルのデータを取得します。",
  })
  @ApiResponse({
    status: 200,
    description: "OK",
    type: RoadHdTrafficGetResponse,
  })
  @ApiBadRequestResponse({ description: BAD_REQUEST_MESSAGE })
  @ApiUnauthorizedResponse({ description: UNAUTHORIZED_ERROR_MESSAGE })
  @ApiInternalServerErrorResponse({ description: INTERNAL_SERVER_ERROR_MESSAGE })
  async getHdExtraTrafficGeoJSON(@Param() param: RoadExtraTrafficGetParamDTO): Promise<RoadHdTrafficGetResponse> {
    try {
      return this.service.getExtraTrafficGeoJSON<RoadTrafficProperties>(MAP_SOURCE.TRAFFIC, param);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      } else if (error instanceof Error) {
        throw new InternalServerErrorException();
      }
    }
  }

  @Get(`/${ENDPOINT.TRIP_TIME}`)
  @ApiOperation({ summary: "C-2-2[B] 旅行時間情報データモデル取得", description: "旅行時間情報データモデルのデータを取得します。" })
  @ApiProduces("application/json")
  @ApiResponse({
    status: 200,
    description: "OK",
    type: RoadTripTimeGetResponse,
  })
  @ApiBadRequestResponse({ description: BAD_REQUEST_MESSAGE })
  @ApiUnauthorizedResponse({ description: UNAUTHORIZED_ERROR_MESSAGE })
  @ApiUnprocessableEntityResponse({ description: UNPROCESSABLE_ENTITY_RESPONSE_MESSAGE })
  @ApiInternalServerErrorResponse({ description: INTERNAL_SERVER_ERROR_MESSAGE })
  async getTripTimeGeoJSON(@Query() condition: CommonRoadGeoJSONGetWithoutTimestampQueryDTO): Promise<RoadTripTimeGetResponse> {
    try {
      return this.service.getGeoJSON<RoadTripTimeProperties>(MAP_SOURCE.TRIP_TIME, condition);
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

  @Get(`/${ENDPOINT.CONSTRUCTION_EVENT}`)
  @ApiOperation({ summary: "C-2-2[B] 工事行事予定情報データモデル取得", description: "工事行事予定情報データモデルのデータを取得します。" })
  @ApiProduces("application/json")
  @ApiResponse({
    status: 200,
    description: "OK",
    type: RoadConstructionEventGetResponse,
  })
  @ApiBadRequestResponse({ description: BAD_REQUEST_MESSAGE })
  @ApiUnauthorizedResponse({ description: UNAUTHORIZED_ERROR_MESSAGE })
  @ApiUnprocessableEntityResponse({ description: UNPROCESSABLE_ENTITY_RESPONSE_MESSAGE })
  @ApiInternalServerErrorResponse({ description: INTERNAL_SERVER_ERROR_MESSAGE })
  async getConstructionEventGeoJSON(@Query() condition: RoadGeoJSONWithTimestampGetQueryDTO): Promise<RoadConstructionEventGetResponse> {
    try {
      return this.service.getGeoJSON<RoadConstructionEventProperties>(MAP_SOURCE.CONSTRUCTION_EVENT, condition);
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

  @Get(`/${ENDPOINT.WINTER_CLOSURE}`)
  @ApiOperation({ summary: "C-2-2[B] 冬季閉鎖情報データモデル取得", description: "冬季閉鎖情報データモデルのデータを取得します。" })
  @ApiProduces("application/json")
  @ApiResponse({
    status: 200,
    description: "OK",
    type: RoadWinterClosureGetResponse,
  })
  @ApiBadRequestResponse({ description: BAD_REQUEST_MESSAGE })
  @ApiUnauthorizedResponse({ description: UNAUTHORIZED_ERROR_MESSAGE })
  @ApiUnprocessableEntityResponse({ description: UNPROCESSABLE_ENTITY_RESPONSE_MESSAGE })
  @ApiInternalServerErrorResponse({ description: INTERNAL_SERVER_ERROR_MESSAGE })
  async getWinterClosureGeoJSON(@Query() condition: RoadGeoJSONWithTimestampGetQueryDTO): Promise<RoadWinterClosureGetResponse> {
    try {
      return this.service.getGeoJSON<RoadWinterClosureProperties>(MAP_SOURCE.WINTER_CLOSURE, condition);
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

  @Get(`/${ENDPOINT.ENTRY_EXIT}`)
  @ApiOperation({ summary: "C-2-2[B] 入口出口閉鎖情報データモデル取得", description: "入口出口閉鎖情報データモデルのデータを取得します。" })
  @ApiProduces("application/json")
  @ApiResponse({
    status: 200,
    description: "OK",
    type: RoadEntryExitGetResponse,
  })
  @ApiBadRequestResponse({ description: BAD_REQUEST_MESSAGE })
  @ApiUnauthorizedResponse({ description: UNAUTHORIZED_ERROR_MESSAGE })
  @ApiUnprocessableEntityResponse({ description: UNPROCESSABLE_ENTITY_RESPONSE_MESSAGE })
  @ApiInternalServerErrorResponse({ description: INTERNAL_SERVER_ERROR_MESSAGE })
  async getEntryExitGeoJSON(@Query() condition: CommonRoadGeoJSONGetWithoutTimestampQueryDTO): Promise<RoadEntryExitGetResponse> {
    try {
      return this.service.getGeoJSON<RoadEntryExitProperties>(MAP_SOURCE.ENTRY_EXIT, condition);
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

  @Get("/map/:sourceId/:z/:x/:y.pbf")
  @ApiOperation({ summary: "C-2-2[B] 道路情報PBF取得", description: "道路情報PBFを取得します。" })
  @ApiProduces("application/vnd.mapbox-vector-tile")
  @ApiResponse({
    status: 200,
    description: "OK",
  })
  @ApiBadRequestResponse({ description: BAD_REQUEST_MESSAGE })
  @ApiUnauthorizedResponse({ description: UNAUTHORIZED_ERROR_MESSAGE })
  @ApiInternalServerErrorResponse({ description: INTERNAL_SERVER_ERROR_MESSAGE })
  async getPBF(@Param() param: RoadPBFGetParamDTO, @Query() condition: RoadPBFGetQueryDTO, @Res() res: Response) {
    try {
      const { timestamp } = condition;
      const buffer: Buffer = await this.service.createPBFBuffer(param.sourceId, param.x, param.y, param.z, timestamp);
      if (!buffer || !buffer.length) {
        return {};
      }
      PBF.setResponse(res, param.sourceId, buffer);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      } else if (error instanceof Error) {
        throw new InternalServerErrorException();
      }
    }
  }
}
