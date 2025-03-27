import { createMock } from "@golevelup/ts-jest";
import { Test, TestingModule } from "@nestjs/testing";
import { plainToInstance } from "class-transformer";
import { Response } from "express";
import { PBF } from "../../shares/pbf/pbf";
import { RoadController } from "../road.controller";
import {
  CommonRoadGeoJSONGetQueryDTO,
  CommonRoadGeoJSONGetWithoutTimestampQueryDTO,
  FeatureCollectionDto,
  HdLaneCenterGeoJSONGetQueryDTO,
  RoadExtraTrafficGetParamDTO,
  RoadGeoJSONWithTimestampGetQueryDTO,
  RoadPBFGetParamDTO,
  RoadPBFGetQueryDTO,
} from "../dto/road.dto";
import { RoadService } from "../road.service";
import { MAP_SOURCE } from "src/consts/map.const";
import { RoadHdLaneCenterProperties } from "../dto/road-hd-lane-center-properties";
import { RoadHdRoadEdgeProperties } from "../dto/road-hd-road-edge-properties";
import { RoadHdIIntersectionProperties } from "../dto/road-hd-intersection-properties";
import { RoadHdPavementMarkingProperties } from "../dto/road-hd-road-pavement-marking-properties";
import { RoadHdSignProperties } from "../dto/road-hd-sign-properties";
import { RoadTrafficProperties } from "../dto/road-traffic-properties";
import { RoadTripTimeProperties } from "../dto/road-trip-time-properties";
import { RoadConstructionEventProperties } from "../dto/road-construction-event-properties";
import { RoadWinterClosureProperties } from "../dto/road-winter-closure-properties";
import { RoadEntryExitProperties } from "../dto/road-entry-exit-properties";
import { RoadHdLaneLineProperties } from "../dto/road-hd-lane-line-properties";
import { LoggerService } from "src/modules/util/logger/logger.service";
import { BadRequestException, InternalServerErrorException, UnprocessableEntityException } from "@nestjs/common";
import { CannotExecuteNotConnectedError } from "typeorm";

describe("RoadController", () => {
  let controller: RoadController;
  let service: RoadService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoadController],
      providers: [{ provide: RoadService, useValue: createMock<RoadService>() }, LoggerService],
    }).compile();

    controller = module.get<RoadController>(RoadController);
    service = module.get<RoadService>(RoadService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getHdLaneCenterGeoJSON(HD地図車線中心線・交通規制情報)", () => {
    const queryDto = plainToInstance(HdLaneCenterGeoJSONGetQueryDTO, { bbox: [139.6375, 35.491666666666674, 139.65, 35.50000000000001] });

    const data: FeatureCollectionDto<RoadHdLaneCenterProperties> = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "LineString",
            crs: {
              type: "name",
              properties: {
                name: "EPSG:6697",
              },
            },
            coordinates: [[139.649553318, 35.499223545, 9.549462389]],
          },
          properties: {
            roadSegmentId: 1082,
            laneNumber: 1,
            minSeq: 0,
            maxSeq: 6,
            linkId: -1,
            direction: -1,
            classCode: -1,
            nameCode: -1,
            hasNopass: 0,
            hasNoturn: 0,
            hasOneway: 0,
            hasSpeed: 0,
            hasZone30: 0,
          },
        },
      ],
    };

    let spyGetGeoJSON: jest.SpyInstance;
    beforeEach(() => {
      spyGetGeoJSON = jest.spyOn(service, "getGeoJSON").mockResolvedValue(data);
    });

    it("RoadService.createGeoJSON が受け取ったリクエスト内容で実行されること", async () => {
      await controller.getHdLaneCenterGeoJSON(queryDto);

      expect(spyGetGeoJSON).toHaveBeenCalledWith(MAP_SOURCE.HD_LANE_CENTER, {
        bbox: [139.6375, 35.491666666666674, 139.65, 35.50000000000001],
      });
    });

    it("Serviceの戻り値がNull以外の場合、受け取った戻り値がそのまま返却されること", async () => {
      const result = await controller.getHdLaneCenterGeoJSON(queryDto);
      expect(result).toMatchObject(data);
    });

    it("指定した行政区画コードが存在しない場合、UnprocessableEntityExceptionがThrowされること", async () => {
      const queryCityDto = plainToInstance(HdLaneCenterGeoJSONGetQueryDTO, { city: "22104" });

      const spyGetGeoJSONUnprocessableEntity = jest.spyOn(service, "getGeoJSON").mockImplementation(() => {
        throw new UnprocessableEntityException();
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.getHdLaneCenterGeoJSON(queryCityDto)).rejects.toThrow(UnprocessableEntityException);
      // serviceのgetGeoJSONが呼ばれることの確認
      expect(spyGetGeoJSONUnprocessableEntity).toHaveBeenCalledWith(MAP_SOURCE.HD_LANE_CENTER, queryCityDto);
    });

    it("パスパラメータの指定が無い場合、BadRequestExceptionがThrowされること", async () => {
      const queryEmptyDto = plainToInstance(HdLaneCenterGeoJSONGetQueryDTO, {});

      const spyGetGeoJSONBadRequest = jest.spyOn(service, "getGeoJSON").mockImplementation(() => {
        throw new BadRequestException();
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.getHdLaneCenterGeoJSON(queryEmptyDto)).rejects.toThrow(BadRequestException);
      // serviceのgetGeoJSONが呼ばれることの確認
      expect(spyGetGeoJSONBadRequest).toHaveBeenCalledWith(MAP_SOURCE.HD_LANE_CENTER, queryEmptyDto);
    });

    it("DB接続が失敗した場合、InternalServerErrorExceptionがThrowされること", async () => {
      const spyGetGeoJSONNotConnected = jest.spyOn(service, "getGeoJSON").mockImplementation(() => {
        throw new CannotExecuteNotConnectedError("DB接続エラー");
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.getHdLaneCenterGeoJSON(queryDto)).rejects.toThrow(InternalServerErrorException);
      // serviceのgetGeoJSONが呼ばれることの確認
      expect(spyGetGeoJSONNotConnected).toHaveBeenCalledWith(MAP_SOURCE.HD_LANE_CENTER, queryDto);
    });
  });

  describe("getHdLaneLineGeoJSON（HD地図区画線）", () => {
    const queryDto = plainToInstance(CommonRoadGeoJSONGetQueryDTO, { bbox: [139.6375, 35.491666666666674, 139.65, 35.50000000000001] });

    const data: FeatureCollectionDto<RoadHdLaneLineProperties> = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "LineString",
            crs: {
              type: "name",
              properties: {
                name: "EPSG:6697",
              },
            },
            coordinates: [[139.649553318, 35.499223545, 9.549462389]],
          },
          properties: {
            roadSegmentId: 5622,
            ordinalId: 1,
            minSeq: 0,
            maxSeq: 17,
            type: 0,
            color: 0,
            width: 0,
            linkId: 910865,
            direction: 1,
            classCode: 101,
            nameCode: 201120,
          },
        },
      ],
    };

    let spyGetGeoJSON: jest.SpyInstance;
    beforeEach(() => {
      spyGetGeoJSON = jest.spyOn(service, "getGeoJSON").mockResolvedValue(data);
    });

    it("RoadService.createGeoJSON が受け取ったリクエスト内容で実行されること", async () => {
      await controller.getHdLaneLineGeoJSON(queryDto);

      expect(spyGetGeoJSON).toHaveBeenCalledWith(MAP_SOURCE.HD_LANE_LINE, {
        bbox: [139.6375, 35.491666666666674, 139.65, 35.50000000000001],
      });
    });

    it("Serviceの戻り値がNull以外の場合、受け取った戻り値がそのまま返却されること", async () => {
      const result = await controller.getHdLaneLineGeoJSON(queryDto);
      expect(result).toMatchObject(data);
    });

    it("指定した行政区画コードが存在しない場合、UnprocessableEntityExceptionがThrowされること", async () => {
      const queryCityDto = plainToInstance(CommonRoadGeoJSONGetQueryDTO, { city: "22104" });

      const spyGetGeoJSONUnprocessableEntity = jest.spyOn(service, "getGeoJSON").mockImplementation(() => {
        throw new UnprocessableEntityException();
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.getHdLaneLineGeoJSON(queryCityDto)).rejects.toThrow(UnprocessableEntityException);
      // serviceのgetGeoJSONが呼ばれることの確認
      expect(spyGetGeoJSONUnprocessableEntity).toHaveBeenCalledWith(MAP_SOURCE.HD_LANE_LINE, queryCityDto);
    });

    it("パスパラメータの指定が無い場合、BadRequestExceptionがThrowされること", async () => {
      const queryEmptyDto = plainToInstance(CommonRoadGeoJSONGetQueryDTO, {});

      const spyGetGeoJSONBadRequest = jest.spyOn(service, "getGeoJSON").mockImplementation(() => {
        throw new BadRequestException();
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.getHdLaneLineGeoJSON(queryEmptyDto)).rejects.toThrow(BadRequestException);
      // serviceのgetGeoJSONが呼ばれることの確認
      expect(spyGetGeoJSONBadRequest).toHaveBeenCalledWith(MAP_SOURCE.HD_LANE_LINE, queryEmptyDto);
    });

    it("DB接続が失敗した場合、InternalServerErrorExceptionがThrowされること", async () => {
      const spyGetGeoJSONNotConnected = jest.spyOn(service, "getGeoJSON").mockImplementation(() => {
        throw new CannotExecuteNotConnectedError("DB接続エラー");
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.getHdLaneLineGeoJSON(queryDto)).rejects.toThrow(InternalServerErrorException);
      // serviceのgetGeoJSONが呼ばれることの確認
      expect(spyGetGeoJSONNotConnected).toHaveBeenCalledWith(MAP_SOURCE.HD_LANE_LINE, queryDto);
    });
  });

  describe("getHdRoadEdgeGeoJSON（HD地図道路縁）", () => {
    const queryDto = plainToInstance(CommonRoadGeoJSONGetQueryDTO, { bbox: [139.6375, 35.491666666666674, 139.65, 35.50000000000001] });

    const data: FeatureCollectionDto<RoadHdRoadEdgeProperties> = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "LineString",
            crs: {
              type: "name",
              properties: {
                name: "EPSG:6697",
              },
            },
            coordinates: [[139.649553318, 35.499223545, 9.549462389]],
          },
          properties: {
            roadSegmentId: 5622,
            isRoadEdgeRight: 0,
            minSeq: 0,
            maxSeq: 17,
            linkId: 22673216,
            direction: 1,
            classCode: 101,
            nameCode: 0,
          },
        },
      ],
    };

    let spyGetGeoJSON: jest.SpyInstance;
    beforeEach(() => {
      spyGetGeoJSON = jest.spyOn(service, "getGeoJSON").mockResolvedValue(data);
    });

    it("RoadService.createGeoJSON が受け取ったリクエスト内容で実行されること", async () => {
      await controller.getHdRoadEdgeGeoJSON(queryDto);

      expect(spyGetGeoJSON).toHaveBeenCalledWith(MAP_SOURCE.HD_ROAD_EDGE, {
        bbox: [139.6375, 35.491666666666674, 139.65, 35.50000000000001],
      });
    });

    it("Serviceの戻り値がNull以外の場合、受け取った戻り値がそのまま返却されること", async () => {
      const result = await controller.getHdRoadEdgeGeoJSON(queryDto);
      expect(result).toMatchObject(data);
    });

    it("指定した行政区画コードが存在しない場合、UnprocessableEntityExceptionがThrowされること", async () => {
      const queryCityDto = plainToInstance(CommonRoadGeoJSONGetQueryDTO, { city: "22104" });

      const spyGetGeoJSONUnprocessableEntity = jest.spyOn(service, "getGeoJSON").mockImplementation(() => {
        throw new UnprocessableEntityException();
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.getHdRoadEdgeGeoJSON(queryCityDto)).rejects.toThrow(UnprocessableEntityException);
      // serviceのgetGeoJSONが呼ばれることの確認
      expect(spyGetGeoJSONUnprocessableEntity).toHaveBeenCalledWith(MAP_SOURCE.HD_ROAD_EDGE, queryCityDto);
    });

    it("パスパラメータの指定が無い場合、BadRequestExceptionがThrowされること", async () => {
      const queryEmptyDto = plainToInstance(CommonRoadGeoJSONGetQueryDTO, {});

      const spyGetGeoJSONBadRequest = jest.spyOn(service, "getGeoJSON").mockImplementation(() => {
        throw new BadRequestException();
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.getHdRoadEdgeGeoJSON(queryEmptyDto)).rejects.toThrow(BadRequestException);
      // serviceのgetGeoJSONが呼ばれることの確認
      expect(spyGetGeoJSONBadRequest).toHaveBeenCalledWith(MAP_SOURCE.HD_ROAD_EDGE, queryEmptyDto);
    });

    it("DB接続が失敗した場合、InternalServerErrorExceptionがThrowされること", async () => {
      const spyGetGeoJSONNotConnected = jest.spyOn(service, "getGeoJSON").mockImplementation(() => {
        throw new CannotExecuteNotConnectedError("DB接続エラー");
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.getHdRoadEdgeGeoJSON(queryDto)).rejects.toThrow(InternalServerErrorException);
      // serviceのgetGeoJSONが呼ばれることの確認
      expect(spyGetGeoJSONNotConnected).toHaveBeenCalledWith(MAP_SOURCE.HD_ROAD_EDGE, queryDto);
    });
  });

  describe("getHdIntersectionLineGeoJSON（HD地図交差点）", () => {
    const queryDto = plainToInstance(CommonRoadGeoJSONGetQueryDTO, { bbox: [139.6375, 35.491666666666674, 139.65, 35.50000000000001] });

    const data: FeatureCollectionDto<RoadHdIIntersectionProperties> = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "POINT",
            crs: {
              type: "name",
              properties: {
                name: "EPSG:6697",
              },
            },
            coordinates: [[139.649553318, 35.499223545, 9.549462389]],
          },
          properties: {
            id: 105044,
            roadSegmentIds: [27541],
            classCodes: ["_101_"],
            nameCodes: [201120],
          },
        },
      ],
    };

    let spyGetGeoJSON: jest.SpyInstance;
    beforeEach(() => {
      spyGetGeoJSON = jest.spyOn(service, "getGeoJSON").mockResolvedValue(data);
    });

    it("RoadService.createGeoJSON が受け取ったリクエスト内容で実行されること", async () => {
      await controller.getHdIntersectionLineGeoJSON(queryDto);

      expect(spyGetGeoJSON).toHaveBeenCalledWith(MAP_SOURCE.HD_INTERSECTION, {
        bbox: [139.6375, 35.491666666666674, 139.65, 35.50000000000001],
      });
    });

    it("Serviceの戻り値がNull以外の場合、受け取った戻り値がそのまま返却されること", async () => {
      const result = await controller.getHdIntersectionLineGeoJSON(queryDto);
      expect(result).toMatchObject(data);
    });

    it("指定した行政区画コードが存在しない場合、UnprocessableEntityExceptionがThrowされること", async () => {
      const queryCityDto = plainToInstance(CommonRoadGeoJSONGetQueryDTO, { city: "22104" });

      const spyGetGeoJSONUnprocessableEntity = jest.spyOn(service, "getGeoJSON").mockImplementation(() => {
        throw new UnprocessableEntityException();
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.getHdIntersectionLineGeoJSON(queryCityDto)).rejects.toThrow(UnprocessableEntityException);
      // serviceのgetGeoJSONが呼ばれることの確認
      expect(spyGetGeoJSONUnprocessableEntity).toHaveBeenCalledWith(MAP_SOURCE.HD_INTERSECTION, queryCityDto);
    });

    it("パスパラメータの指定が無い場合、BadRequestExceptionがThrowされること", async () => {
      const queryEmptyDto = plainToInstance(CommonRoadGeoJSONGetQueryDTO, {});

      const spyGetGeoJSONBadRequest = jest.spyOn(service, "getGeoJSON").mockImplementation(() => {
        throw new BadRequestException();
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.getHdIntersectionLineGeoJSON(queryEmptyDto)).rejects.toThrow(BadRequestException);
      // serviceのgetGeoJSONが呼ばれることの確認
      expect(spyGetGeoJSONBadRequest).toHaveBeenCalledWith(MAP_SOURCE.HD_INTERSECTION, queryEmptyDto);
    });

    it("DB接続が失敗した場合、InternalServerErrorExceptionがThrowされること", async () => {
      const spyGetGeoJSONNotConnected = jest.spyOn(service, "getGeoJSON").mockImplementation(() => {
        throw new CannotExecuteNotConnectedError("DB接続エラー");
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.getHdIntersectionLineGeoJSON(queryDto)).rejects.toThrow(InternalServerErrorException);
      // serviceのgetGeoJSONが呼ばれることの確認
      expect(spyGetGeoJSONNotConnected).toHaveBeenCalledWith(MAP_SOURCE.HD_INTERSECTION, queryDto);
    });
  });

  describe("getHdPavementMarkingGeoJSON（HD地図路面標識）", () => {
    const queryDto = plainToInstance(CommonRoadGeoJSONGetQueryDTO, { bbox: [139.6375, 35.491666666666674, 139.65, 35.50000000000001] });

    const data: FeatureCollectionDto<RoadHdPavementMarkingProperties> = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "POINT",
            crs: {
              type: "name",
              properties: {
                name: "EPSG:6697",
              },
            },
            coordinates: [[139.649553318, 35.499223545, 9.549462389]],
          },
          properties: {
            id: 105044,
            type: 10,
            roadSegmentIds: [27541],
            classCodes: ["_101_"],
            nameCodes: [201120],
          },
        },
      ],
    };

    let spyGetGeoJSON: jest.SpyInstance;
    beforeEach(() => {
      spyGetGeoJSON = jest.spyOn(service, "getGeoJSON").mockResolvedValue(data);
    });

    it("RoadService.createGeoJSON が受け取ったリクエスト内容で実行されること", async () => {
      await controller.getHdPavementMarkingGeoJSON(queryDto);

      expect(spyGetGeoJSON).toHaveBeenCalledWith(MAP_SOURCE.HD_PAVEMENT_MARKING, {
        bbox: [139.6375, 35.491666666666674, 139.65, 35.50000000000001],
      });
    });

    it("Serviceの戻り値がNull以外の場合、受け取った戻り値がそのまま返却されること", async () => {
      const result = await controller.getHdPavementMarkingGeoJSON(queryDto);
      expect(result).toMatchObject(data);
    });

    it("指定した行政区画コードが存在しない場合、UnprocessableEntityExceptionがThrowされること", async () => {
      const queryCityDto = plainToInstance(CommonRoadGeoJSONGetQueryDTO, { city: "22104" });

      const spyGetGeoJSONUnprocessableEntity = jest.spyOn(service, "getGeoJSON").mockImplementation(() => {
        throw new UnprocessableEntityException();
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.getHdPavementMarkingGeoJSON(queryCityDto)).rejects.toThrow(UnprocessableEntityException);
      // serviceのgetGeoJSONが呼ばれることの確認
      expect(spyGetGeoJSONUnprocessableEntity).toHaveBeenCalledWith(MAP_SOURCE.HD_PAVEMENT_MARKING, queryCityDto);
    });

    it("パスパラメータの指定が無い場合、BadRequestExceptionがThrowされること", async () => {
      const queryEmptyDto = plainToInstance(CommonRoadGeoJSONGetQueryDTO, {});

      const spyGetGeoJSONBadRequest = jest.spyOn(service, "getGeoJSON").mockImplementation(() => {
        throw new BadRequestException();
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.getHdPavementMarkingGeoJSON(queryEmptyDto)).rejects.toThrow(BadRequestException);
      // serviceのgetGeoJSONが呼ばれることの確認
      expect(spyGetGeoJSONBadRequest).toHaveBeenCalledWith(MAP_SOURCE.HD_PAVEMENT_MARKING, queryEmptyDto);
    });

    it("DB接続が失敗した場合、InternalServerErrorExceptionがThrowされること", async () => {
      const spyGetGeoJSONNotConnected = jest.spyOn(service, "getGeoJSON").mockImplementation(() => {
        throw new CannotExecuteNotConnectedError("DB接続エラー");
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.getHdPavementMarkingGeoJSON(queryDto)).rejects.toThrow(InternalServerErrorException);
      // serviceのgetGeoJSONが呼ばれることの確認
      expect(spyGetGeoJSONNotConnected).toHaveBeenCalledWith(MAP_SOURCE.HD_PAVEMENT_MARKING, queryDto);
    });
  });

  describe("getHdSignGeoJSON（HD地図道路標識）", () => {
    const queryDto = plainToInstance(CommonRoadGeoJSONGetQueryDTO, { bbox: [139.6375, 35.491666666666674, 139.65, 35.50000000000001] });

    const data: FeatureCollectionDto<RoadHdSignProperties> = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "POINT",
            crs: {
              type: "name",
              properties: {
                name: "EPSG:6697",
              },
            },
            coordinates: [[139.649553318, 35.499223545, 9.549462389]],
          },
          properties: {
            id: 105044,
            roadSegmentIds: [27541],
            classCodes: ["_101_"],
            nameCodes: [201120],
          },
        },
      ],
    };

    let spyGetGeoJSON: jest.SpyInstance;
    beforeEach(() => {
      spyGetGeoJSON = jest.spyOn(service, "getGeoJSON").mockResolvedValue(data);
    });

    it("RoadService.createGeoJSON が受け取ったリクエスト内容で実行されること", async () => {
      await controller.getHdSignGeoJSON(queryDto);

      expect(spyGetGeoJSON).toHaveBeenCalledWith(MAP_SOURCE.HD_SIGN, {
        bbox: [139.6375, 35.491666666666674, 139.65, 35.50000000000001],
      });
    });

    it("Serviceの戻り値がNull以外の場合、受け取った戻り値がそのまま返却されること", async () => {
      const result = await controller.getHdSignGeoJSON(queryDto);
      expect(result).toMatchObject(data);
    });

    it("指定した行政区画コードが存在しない場合、UnprocessableEntityExceptionがThrowされること", async () => {
      const queryCityDto = plainToInstance(CommonRoadGeoJSONGetQueryDTO, { city: "22104" });

      const spyGetGeoJSONUnprocessableEntity = jest.spyOn(service, "getGeoJSON").mockImplementation(() => {
        throw new UnprocessableEntityException();
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.getHdSignGeoJSON(queryCityDto)).rejects.toThrow(UnprocessableEntityException);
      // serviceのgetGeoJSONが呼ばれることの確認
      expect(spyGetGeoJSONUnprocessableEntity).toHaveBeenCalledWith(MAP_SOURCE.HD_SIGN, queryCityDto);
    });

    it("パスパラメータの指定が無い場合、BadRequestExceptionがThrowされること", async () => {
      const queryEmptyDto = plainToInstance(CommonRoadGeoJSONGetQueryDTO, {});

      const spyGetGeoJSONBadRequest = jest.spyOn(service, "getGeoJSON").mockImplementation(() => {
        throw new BadRequestException();
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.getHdSignGeoJSON(queryEmptyDto)).rejects.toThrow(BadRequestException);
      // serviceのgetGeoJSONが呼ばれることの確認
      expect(spyGetGeoJSONBadRequest).toHaveBeenCalledWith(MAP_SOURCE.HD_SIGN, queryEmptyDto);
    });

    it("DB接続が失敗した場合、InternalServerErrorExceptionがThrowされること", async () => {
      const spyGetGeoJSONNotConnected = jest.spyOn(service, "getGeoJSON").mockImplementation(() => {
        throw new CannotExecuteNotConnectedError("DB接続エラー");
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.getHdSignGeoJSON(queryDto)).rejects.toThrow(InternalServerErrorException);
      // serviceのgetGeoJSONが呼ばれることの確認
      expect(spyGetGeoJSONNotConnected).toHaveBeenCalledWith(MAP_SOURCE.HD_SIGN, queryDto);
    });
  });

  describe("getHdTrafficGeoJSON（交通渋滞・規制情報）", () => {
    const queryTrafficDto = plainToInstance(CommonRoadGeoJSONGetWithoutTimestampQueryDTO, {
      bbox: [139.6375, 35.491666666666674, 139.65, 35.50000000000001],
    });
    const paramExtraTrafficDto = plainToInstance(RoadExtraTrafficGetParamDTO, { roadSegmentId: 5622 });

    const data: FeatureCollectionDto<RoadTrafficProperties> = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "LineString",
            crs: {
              type: "name",
              properties: {
                name: "EPSG:6697",
              },
            },
            coordinates: [[139.649553318, 35.499223545, 9.549462389]],
          },
          properties: {
            timestamp: "2024/01/24 4:55:00",
            roadSegmentId: 5622,
            laneNumber: 1,
            minSeq: 1,
            maxSeq: 1,
            linkId: 1,
            direction: 1,
            classCode: 101,
            nameCode: 201120,
            routeName: "新東名",
            directionName: "上り",
            cause: "流出物",
            regulation: "入口閉鎖",
            severity: 2,
            length: 300,
            downstreamKP: 235100,
            downstream: [35.3234536220797, 138.91692717003, -1],
            downstreamDistance: 247693.1,
            upstreamKP: 1,
            upstream: [35.0433151819167, 137.201749377047, -1],
            upstreamDistance: 6386.822,
            laneCategory: "entry",
            plannedEndTimestamp: "2024/01/25 16:45:00",
            causeVehicleName1: "軽自動車",
            causeVehicleNumber1: 3,
            causeVehicleName2: "特殊車両",
            causeVehicleNumber2: 4,
            causeVehicleName3: "大型2t",
            causeVehicleNumber3: 1,
            handlingStatus: "investigating",
            prediction: "nochange",
            plannedResumeTimestamp: "2024/01/26 3:56:00",
          },
        },
      ],
    };

    let spyGetGeoJSON: jest.SpyInstance;
    let spyGetExtraGeoJSON: jest.SpyInstance;
    beforeEach(() => {
      spyGetGeoJSON = jest.spyOn(service, "getGeoJSON").mockResolvedValue(data);
      spyGetExtraGeoJSON = jest.spyOn(service, "getExtraTrafficGeoJSON").mockResolvedValue(data);
    });

    it("RoadService.createGeoJSONが受け取ったリクエスト内容で実行されること", async () => {
      await controller.getHdTrafficGeoJSON(queryTrafficDto);

      expect(spyGetGeoJSON).toHaveBeenCalledWith(MAP_SOURCE.TRAFFIC, {
        bbox: [139.6375, 35.491666666666674, 139.65, 35.50000000000001],
      });
    });

    it("RoadService.createGeoJSONが受け取ったリクエスト内容で実行されること（roadSegmentId）", async () => {
      await controller.getHdExtraTrafficGeoJSON(paramExtraTrafficDto);

      expect(spyGetExtraGeoJSON).toHaveBeenCalledWith(MAP_SOURCE.TRAFFIC, { roadSegmentId: 5622 });
    });

    it("Serviceの戻り値がNull以外の場合、受け取った戻り値がそのまま返却されること", async () => {
      const result = await controller.getHdTrafficGeoJSON(queryTrafficDto);
      expect(result).toMatchObject(data);
    });

    it("Serviceの戻り値がNull以外の場合、受け取った戻り値がそのまま返却されること（roadSegmentId）", async () => {
      const result = await controller.getHdExtraTrafficGeoJSON(paramExtraTrafficDto);
      expect(result).toMatchObject(data);
    });

    it("指定した行政区画コードが存在しない場合、UnprocessableEntityExceptionがThrowされること", async () => {
      const queryCityDto = plainToInstance(CommonRoadGeoJSONGetWithoutTimestampQueryDTO, { city: "22104" });

      const spyGetGeoJSONUnprocessableEntity = jest.spyOn(service, "getGeoJSON").mockImplementation(() => {
        throw new UnprocessableEntityException();
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.getHdTrafficGeoJSON(queryCityDto)).rejects.toThrow(UnprocessableEntityException);
      // serviceのgetGeoJSONが呼ばれることの確認
      expect(spyGetGeoJSONUnprocessableEntity).toHaveBeenCalledWith(MAP_SOURCE.TRAFFIC, queryCityDto);
    });

    it("パスパラメータの指定が無い場合、BadRequestExceptionがThrowされること", async () => {
      const queryEmptyDto = plainToInstance(CommonRoadGeoJSONGetWithoutTimestampQueryDTO, {});

      const spyGetGeoJSONBadRequest = jest.spyOn(service, "getGeoJSON").mockImplementation(() => {
        throw new BadRequestException();
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.getHdTrafficGeoJSON(queryEmptyDto)).rejects.toThrow(BadRequestException);
      // serviceのgetGeoJSONが呼ばれることの確認
      expect(spyGetGeoJSONBadRequest).toHaveBeenCalledWith(MAP_SOURCE.TRAFFIC, queryEmptyDto);
    });

    it("パスパラメータの指定が無い場合、BadRequestExceptionがThrowされること（roadSegmentId）", async () => {
      const paramEmptyDto = plainToInstance(RoadExtraTrafficGetParamDTO, {});

      const spyGetExtraTrafficGeoJSONBadRequest = jest.spyOn(service, "getExtraTrafficGeoJSON").mockImplementation(() => {
        throw new BadRequestException();
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.getHdExtraTrafficGeoJSON(paramEmptyDto)).rejects.toThrow(BadRequestException);
      // serviceのgetExtraTrafficGeoJSONが呼ばれることの確認
      expect(spyGetExtraTrafficGeoJSONBadRequest).toHaveBeenCalledWith(MAP_SOURCE.TRAFFIC, paramEmptyDto);
    });

    it("DB接続が失敗した場合、InternalServerErrorExceptionがThrowされること", async () => {
      const spyGetGeoJSONNotConnected = jest.spyOn(service, "getGeoJSON").mockImplementation(() => {
        throw new CannotExecuteNotConnectedError("DB接続エラー");
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.getHdTrafficGeoJSON(queryTrafficDto)).rejects.toThrow(InternalServerErrorException);
      // serviceのgetGeoJSONが呼ばれることの確認
      expect(spyGetGeoJSONNotConnected).toHaveBeenCalledWith(MAP_SOURCE.TRAFFIC, queryTrafficDto);
    });

    it("DB接続が失敗した場合、InternalServerErrorExceptionがThrowされること（roadSegmentId）", async () => {
      const spyGetExtraTrafficGeoJSONNotConnected = jest.spyOn(service, "getExtraTrafficGeoJSON").mockImplementation(() => {
        throw new CannotExecuteNotConnectedError("DB接続エラー");
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.getHdExtraTrafficGeoJSON(paramExtraTrafficDto)).rejects.toThrow(InternalServerErrorException);
      // serviceのgetExtraTrafficGeoJSONが呼ばれることの確認
      expect(spyGetExtraTrafficGeoJSONNotConnected).toHaveBeenCalledWith(MAP_SOURCE.TRAFFIC, paramExtraTrafficDto);
    });
  });

  describe("getTripTimeGeoJSON（旅行時間情報）", () => {
    const queryDto = plainToInstance(CommonRoadGeoJSONGetWithoutTimestampQueryDTO, {
      bbox: [139.6375, 35.491666666666674, 139.65, 35.50000000000001],
    });

    const data: FeatureCollectionDto<RoadTripTimeProperties> = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "LineString",
            crs: {
              type: "name",
              properties: {
                name: "EPSG:6697",
              },
            },
            coordinates: [[139.649553318, 35.499223545, 9.549462389]],
          },
          properties: {
            timestamp: "2024/06/05 11:00:00",
            roadSegmentId: 5622,
            laneNumber: 1,
            minSeq: 1,
            maxSeq: 1,
            linkId: 1,
            direction: 1,
            classCode: 101,
            nameCode: 201120,
            time: 360000000,
          },
        },
      ],
    };

    let spyGetGeoJSON: jest.SpyInstance;
    beforeEach(() => {
      spyGetGeoJSON = jest.spyOn(service, "getGeoJSON").mockResolvedValue(data);
    });

    it("RoadService.createGeoJSON が受け取ったリクエスト内容で実行されること", async () => {
      await controller.getTripTimeGeoJSON(queryDto);

      expect(spyGetGeoJSON).toHaveBeenCalledWith(MAP_SOURCE.TRIP_TIME, {
        bbox: [139.6375, 35.491666666666674, 139.65, 35.50000000000001],
      });
    });

    it("Serviceの戻り値がNull以外の場合、受け取った戻り値がそのまま返却されること", async () => {
      const result = await controller.getTripTimeGeoJSON(queryDto);
      expect(result).toMatchObject(data);
    });

    it("指定した行政区画コードが存在しない場合、UnprocessableEntityExceptionがThrowされること", async () => {
      const queryCityDto = plainToInstance(CommonRoadGeoJSONGetWithoutTimestampQueryDTO, { city: "22104" });

      const spyGetGeoJSONUnprocessableEntity = jest.spyOn(service, "getGeoJSON").mockImplementation(() => {
        throw new UnprocessableEntityException();
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.getTripTimeGeoJSON(queryCityDto)).rejects.toThrow(UnprocessableEntityException);
      // serviceのgetGeoJSONが呼ばれることの確認
      expect(spyGetGeoJSONUnprocessableEntity).toHaveBeenCalledWith(MAP_SOURCE.TRIP_TIME, queryCityDto);
    });

    it("パスパラメータの指定が無い場合、BadRequestExceptionがThrowされること", async () => {
      const queryEmptyDto = plainToInstance(CommonRoadGeoJSONGetWithoutTimestampQueryDTO, {});

      const spyGetGeoJSONBadRequest = jest.spyOn(service, "getGeoJSON").mockImplementation(() => {
        throw new BadRequestException();
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.getTripTimeGeoJSON(queryEmptyDto)).rejects.toThrow(BadRequestException);
      // serviceのgetGeoJSONが呼ばれることの確認
      expect(spyGetGeoJSONBadRequest).toHaveBeenCalledWith(MAP_SOURCE.TRIP_TIME, queryEmptyDto);
    });

    it("DB接続が失敗した場合、InternalServerErrorExceptionがThrowされること", async () => {
      const spyGetGeoJSONNotConnected = jest.spyOn(service, "getGeoJSON").mockImplementation(() => {
        throw new CannotExecuteNotConnectedError("DB接続エラー");
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.getTripTimeGeoJSON(queryDto)).rejects.toThrow(InternalServerErrorException);
      // serviceのgetGeoJSONが呼ばれることの確認
      expect(spyGetGeoJSONNotConnected).toHaveBeenCalledWith(MAP_SOURCE.TRIP_TIME, queryDto);
    });
  });

  describe("getConstructionEventGeoJSON（工事行事予定情報）", () => {
    const queryDto = plainToInstance(RoadGeoJSONWithTimestampGetQueryDTO, {
      bbox: [139.6375, 35.491666666666674, 139.65, 35.50000000000001],
    });

    const data: FeatureCollectionDto<RoadConstructionEventProperties> = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "LineString",
            crs: {
              type: "name",
              properties: {
                name: "EPSG:6697",
              },
            },
            coordinates: [[139.649553318, 35.499223545, 9.549462389]],
          },
          properties: {
            timestamp: "2024/01/24 4:55:00",
            roadSegmentId: 5622,
            laneNumber: 1,
            minSeq: 1,
            maxSeq: 1,
            linkId: 1,
            direction: 1,
            classCode: 101,
            nameCode: 201120,
            routeName: "新東名",
            directionName: "上り",
            cause: "人工雪崩作業",
            regulation: "雪用タイヤ着",
            downstreamKP: 283230,
            downstream: [35.0433151819167, 137.201749377047, -1],
            downstreamDistance: 113203,
            upstreamKP: 0,
            upstream: [35.3234536220797, 138.91692717003, -1],
            upstreamDistance: 170027,
            laneCategory: "main",
            plannedStartTimestamp: "2024/10/06 12:00:00",
            plannedEndTimestamp: "2024/01/25 16:45:00",
            endTimestamp: "2024/10/08 12:00:00",
            detour1: undefined,
            detour2: undefined,
            isCurrentStatus: 1,
          },
        },
      ],
    };

    let spyGetGeoJSON: jest.SpyInstance;
    beforeEach(() => {
      spyGetGeoJSON = jest.spyOn(service, "getGeoJSON").mockResolvedValue(data);
    });

    it("RoadService.createGeoJSON が受け取ったリクエスト内容で実行されること", async () => {
      await controller.getConstructionEventGeoJSON(queryDto);

      expect(spyGetGeoJSON).toHaveBeenCalledWith(MAP_SOURCE.CONSTRUCTION_EVENT, {
        bbox: [139.6375, 35.491666666666674, 139.65, 35.50000000000001],
      });
    });

    it("Serviceの戻り値がNull以外の場合、受け取った戻り値がそのまま返却されること", async () => {
      const result = await controller.getConstructionEventGeoJSON(queryDto);
      expect(result).toMatchObject(data);
    });

    it("指定した行政区画コードが存在しない場合、UnprocessableEntityExceptionがThrowされること", async () => {
      const queryCityDto = plainToInstance(RoadGeoJSONWithTimestampGetQueryDTO, { city: "22104" });

      const spyGetGeoJSONUnprocessableEntity = jest.spyOn(service, "getGeoJSON").mockImplementation(() => {
        throw new UnprocessableEntityException();
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.getConstructionEventGeoJSON(queryCityDto)).rejects.toThrow(UnprocessableEntityException);
      // serviceのgetGeoJSONが呼ばれることの確認
      expect(spyGetGeoJSONUnprocessableEntity).toHaveBeenCalledWith(MAP_SOURCE.CONSTRUCTION_EVENT, queryCityDto);
    });

    it("パスパラメータの指定が無い場合、BadRequestExceptionがThrowされること", async () => {
      const queryEmptyDto = plainToInstance(RoadGeoJSONWithTimestampGetQueryDTO, {});

      const spyGetGeoJSONBadRequest = jest.spyOn(service, "getGeoJSON").mockImplementation(() => {
        throw new BadRequestException();
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.getConstructionEventGeoJSON(queryEmptyDto)).rejects.toThrow(BadRequestException);
      // serviceのgetGeoJSONが呼ばれることの確認
      expect(spyGetGeoJSONBadRequest).toHaveBeenCalledWith(MAP_SOURCE.CONSTRUCTION_EVENT, queryEmptyDto);
    });

    it("DB接続が失敗した場合、InternalServerErrorExceptionがThrowされること", async () => {
      const spyGetGeoJSONNotConnected = jest.spyOn(service, "getGeoJSON").mockImplementation(() => {
        throw new CannotExecuteNotConnectedError("DB接続エラー");
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.getConstructionEventGeoJSON(queryDto)).rejects.toThrow(InternalServerErrorException);
      // serviceのgetGeoJSONが呼ばれることの確認
      expect(spyGetGeoJSONNotConnected).toHaveBeenCalledWith(MAP_SOURCE.CONSTRUCTION_EVENT, queryDto);
    });
  });

  describe("getWinterClosureGeoJSON（冬季閉鎖情報）", () => {
    const queryDto = plainToInstance(RoadGeoJSONWithTimestampGetQueryDTO, {
      bbox: [139.6375, 35.491666666666674, 139.65, 35.50000000000001],
    });

    const data: FeatureCollectionDto<RoadWinterClosureProperties> = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "LineString",
            crs: {
              type: "name",
              properties: {
                name: "EPSG:6697",
              },
            },
            coordinates: [[139.649553318, 35.499223545, 9.549462389]],
          },
          properties: {
            timestamp: "2024/10/08 7:55:00",
            roadSegmentId: 5622,
            laneNumber: 1,
            minSeq: 1,
            maxSeq: 1,
            linkId: 1,
            direction: 1,
            classCode: 101,
            nameCode: 201120,
            routeName: "新東名",
            directionName: "上り",
            cause: "積雪",
            regulation: "通行止",
            downstream: [35.0433151819167, 137.201749377047, -1],
            downstreamDistance: 75726.69226569,
            upstream: [35.3234536220797, 138.91692717003, -1],
            upstreamDistance: 280637.682935945,
            laneCategory: "junction",
            plannedStartTimestamp: "2023/12/01 3:15:00",
            plannedEndTimestamp: "2024/11/25 1:00:00",
            endTimestamp: "2024/10/08 12:00:00",
            detour1: undefined,
            detour2: "迂回路2",
            isCurrentStatus: 1,
          },
        },
      ],
    };

    let spyGetGeoJSON: jest.SpyInstance;
    beforeEach(() => {
      spyGetGeoJSON = jest.spyOn(service, "getGeoJSON").mockResolvedValue(data);
    });

    it("RoadService.createGeoJSON が受け取ったリクエスト内容で実行されること", async () => {
      await controller.getWinterClosureGeoJSON(queryDto);

      expect(spyGetGeoJSON).toHaveBeenCalledWith(MAP_SOURCE.WINTER_CLOSURE, {
        bbox: [139.6375, 35.491666666666674, 139.65, 35.50000000000001],
      });
    });

    it("Serviceの戻り値がNull以外の場合、受け取った戻り値がそのまま返却されること", async () => {
      const result = await controller.getWinterClosureGeoJSON(queryDto);
      expect(result).toMatchObject(data);
    });

    it("指定した行政区画コードが存在しない場合、UnprocessableEntityExceptionがThrowされること", async () => {
      const queryCityDto = plainToInstance(RoadGeoJSONWithTimestampGetQueryDTO, { city: "22104" });

      const spyGetGeoJSONUnprocessableEntity = jest.spyOn(service, "getGeoJSON").mockImplementation(() => {
        throw new UnprocessableEntityException();
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.getWinterClosureGeoJSON(queryCityDto)).rejects.toThrow(UnprocessableEntityException);
      // serviceのgetGeoJSONが呼ばれることの確認
      expect(spyGetGeoJSONUnprocessableEntity).toHaveBeenCalledWith(MAP_SOURCE.WINTER_CLOSURE, queryCityDto);
    });

    it("パスパラメータの指定が無い場合、BadRequestExceptionがThrowされること", async () => {
      const queryEmptyDto = plainToInstance(RoadGeoJSONWithTimestampGetQueryDTO, {});

      const spyGetGeoJSONBadRequest = jest.spyOn(service, "getGeoJSON").mockImplementation(() => {
        throw new BadRequestException();
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.getWinterClosureGeoJSON(queryEmptyDto)).rejects.toThrow(BadRequestException);
      // serviceのgetGeoJSONが呼ばれることの確認
      expect(spyGetGeoJSONBadRequest).toHaveBeenCalledWith(MAP_SOURCE.WINTER_CLOSURE, queryEmptyDto);
    });

    it("DB接続が失敗した場合、InternalServerErrorExceptionがThrowされること", async () => {
      const spyGetGeoJSONNotConnected = jest.spyOn(service, "getGeoJSON").mockImplementation(() => {
        throw new CannotExecuteNotConnectedError("DB接続エラー");
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.getWinterClosureGeoJSON(queryDto)).rejects.toThrow(InternalServerErrorException);
      // serviceのgetGeoJSONが呼ばれることの確認
      expect(spyGetGeoJSONNotConnected).toHaveBeenCalledWith(MAP_SOURCE.WINTER_CLOSURE, queryDto);
    });
  });

  describe("getEntryExitGeoJSON（入口出口閉鎖情報）", () => {
    const queryDto = plainToInstance(CommonRoadGeoJSONGetWithoutTimestampQueryDTO, {
      bbox: [139.6375, 35.491666666666674, 139.65, 35.50000000000001],
    });
    const data: FeatureCollectionDto<RoadEntryExitProperties> = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "LineString",
            crs: {
              type: "name",
              properties: {
                name: "EPSG:6697",
              },
            },
            coordinates: [[139.649553318, 35.499223545, 9.549462389]],
          },
          properties: {
            timestamp: "2024/10/01 11:24:00",
            roadSegmentId: 5622,
            laneNumber: 1,
            minSeq: 1,
            maxSeq: 1,
            linkId: 1,
            direction: 1,
            classCode: 101,
            nameCode: 201120,
            routeName: "新東名",
            directionName: "上り",
            name: "長泉沼津ＩＣ",
            location: [35.160099158552, 138.872996813366, -1],
            isEntrance: 1,
          },
        },
      ],
    };

    let spyGetGeoJSON: jest.SpyInstance;
    beforeEach(() => {
      spyGetGeoJSON = jest.spyOn(service, "getGeoJSON").mockResolvedValue(data);
    });

    it("RoadService.createGeoJSON が受け取ったリクエスト内容で実行されること", async () => {
      await controller.getEntryExitGeoJSON(queryDto);

      expect(spyGetGeoJSON).toHaveBeenCalledWith(MAP_SOURCE.ENTRY_EXIT, {
        bbox: [139.6375, 35.491666666666674, 139.65, 35.50000000000001],
      });
    });

    it("Serviceの戻り値がNull以外の場合、受け取った戻り値がそのまま返却されること", async () => {
      const result = await controller.getEntryExitGeoJSON(queryDto);
      expect(result).toMatchObject(data);
    });

    it("指定した行政区画コードが存在しない場合、UnprocessableEntityExceptionがThrowされること", async () => {
      const queryCityDto = plainToInstance(CommonRoadGeoJSONGetWithoutTimestampQueryDTO, { city: "22104" });

      const spyGetGeoJSONUnprocessableEntity = jest.spyOn(service, "getGeoJSON").mockImplementation(() => {
        throw new UnprocessableEntityException();
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.getEntryExitGeoJSON(queryCityDto)).rejects.toThrow(UnprocessableEntityException);
      // serviceのgetGeoJSONが呼ばれることの確認
      expect(spyGetGeoJSONUnprocessableEntity).toHaveBeenCalledWith(MAP_SOURCE.ENTRY_EXIT, queryCityDto);
    });

    it("パスパラメータの指定が無い場合、BadRequestExceptionがThrowされること", async () => {
      const queryEmptyDto = plainToInstance(CommonRoadGeoJSONGetWithoutTimestampQueryDTO, {});

      const spyGetGeoJSONBadRequest = jest.spyOn(service, "getGeoJSON").mockImplementation(() => {
        throw new BadRequestException();
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.getEntryExitGeoJSON(queryEmptyDto)).rejects.toThrow(BadRequestException);
      // serviceのgetGeoJSONが呼ばれることの確認
      expect(spyGetGeoJSONBadRequest).toHaveBeenCalledWith(MAP_SOURCE.ENTRY_EXIT, queryEmptyDto);
    });

    it("DB接続が失敗した場合、InternalServerErrorExceptionがThrowされること", async () => {
      const spyGetGeoJSONNotConnected = jest.spyOn(service, "getGeoJSON").mockImplementation(() => {
        throw new CannotExecuteNotConnectedError("DB接続エラー");
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.getEntryExitGeoJSON(queryDto)).rejects.toThrow(InternalServerErrorException);
      // serviceのgetGeoJSONが呼ばれることの確認
      expect(spyGetGeoJSONNotConnected).toHaveBeenCalledWith(MAP_SOURCE.ENTRY_EXIT, queryDto);
    });
  });

  describe("getPBF（道路情報PBF）", () => {
    const paramDto = plainToInstance(RoadPBFGetParamDTO, {
      sourceId: MAP_SOURCE.HD_LANE_LINE,
      x: 13000,
      y: 12000,
      z: 16,
    });
    const queryDto = plainToInstance(RoadPBFGetQueryDTO, { timestamp: "2024-01-23T11:22:33Z" });

    const mockRes = createMock<Response>();

    let spyCreatePBFBuffer: jest.SpyInstance;
    let spySetResponse: jest.SpyInstance;

    beforeEach(() => {
      spyCreatePBFBuffer = jest.spyOn(service, "createPBFBuffer").mockResolvedValue(Buffer.from("abc"));
      spySetResponse = jest.spyOn(PBF, "setResponse").mockImplementation(() => jest.fn());
    });

    it("RoadService.createPBFBuffer が受け取ったリクエスト内容で実行されること", async () => {
      await controller.getPBF(paramDto, queryDto, mockRes);

      expect(spyCreatePBFBuffer).toHaveBeenCalledWith(MAP_SOURCE.HD_LANE_LINE, 13000, 12000, 16, "2024-01-23T11:22:33Z");
    });

    it("戻り値がNullの場合、NotFoundExceptionがThrowされること", async () => {
      spyCreatePBFBuffer.mockResolvedValue(null);

      const result = await controller.getPBF(paramDto, queryDto, mockRes);
      expect(result).toEqual({});
    });

    it("Bufferの内容が空の場合、NotFoundExceptionがThrowされること", async () => {
      spyCreatePBFBuffer.mockResolvedValue(Buffer.from(""));

      const result = await controller.getPBF(paramDto, queryDto, mockRes);
      expect(result).toEqual({});
    });

    it("Bufferの内容が空以外の場合、PBF.setResponseが実行されること", async () => {
      const mockRes = createMock<Response>();
      await controller.getPBF(paramDto, queryDto, mockRes);

      expect(spySetResponse).toHaveBeenCalledWith(mockRes, MAP_SOURCE.HD_LANE_LINE, Buffer.from("abc"));
    });

    it("パスパラメータの指定が無い場合、BadRequestExceptionがThrowされること", async () => {
      const paramEmptyDto = plainToInstance(RoadPBFGetParamDTO, {});

      const spyCreatePBFBufferBadRequest = jest.spyOn(service, "createPBFBuffer").mockImplementation(() => {
        throw new BadRequestException();
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.getPBF(paramEmptyDto, queryDto, mockRes)).rejects.toThrow(BadRequestException);
      // serviceのcreatePBFBufferが呼ばれることの確認
      expect(spyCreatePBFBufferBadRequest).toHaveBeenCalledWith(
        paramEmptyDto.sourceId,
        paramEmptyDto.x,
        paramEmptyDto.y,
        paramEmptyDto.z,
        queryDto.timestamp,
      );
    });

    it("DB接続が失敗した場合、InternalServerErrorExceptionがThrowされること", async () => {
      const spyCreatePBFBufferNotConnected = jest.spyOn(service, "createPBFBuffer").mockImplementation(() => {
        throw new CannotExecuteNotConnectedError("DB接続エラー");
      });

      // アサーションの呼び出し確認
      expect.assertions(2);

      // 実行して結果を比較
      await expect(controller.getPBF(paramDto, queryDto, mockRes)).rejects.toThrow(InternalServerErrorException);
      // serviceのgetGeoJSONが呼ばれることの確認
      expect(spyCreatePBFBufferNotConnected).toHaveBeenCalledWith(
        paramDto.sourceId,
        paramDto.x,
        paramDto.y,
        paramDto.z,
        queryDto.timestamp,
      );
    });
  });
});
