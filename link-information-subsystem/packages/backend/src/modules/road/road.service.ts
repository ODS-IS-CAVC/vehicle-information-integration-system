import { BadRequestException, Injectable } from "@nestjs/common";
import { CropMap } from "../shares/crop/crop";
import { GeoJsonLib } from "../shares/geojson.lib.interface";
import { Convert } from "../shares/lib/convert";
import { RoadHdLaneCenter } from "./lib/road-hd-lane-center";
import { DataSource, QueryFailedError } from "typeorm";
import { InjectDataSource } from "@nestjs/typeorm";
import {
  CommonRoadGeoJSONGetQueryDTO,
  CommonRoadGeoJSONGetWithoutTimestampQueryDTO,
  FeatureCollectionDto,
  HdLaneCenterGeoJSONGetQueryDTO,
  RoadExtraTrafficGetParamDTO,
  RoadGeoJSONWithTimestampGetQueryDTO,
} from "./dto/road.dto";
import { getBBox, ZFXYTile } from "src/ouranos-gex-lib/src/zfxy";
import { CoordinateService } from "../util/coordinate.service";
import { SchemaRelationService } from "../util/schema-relation.service";
import { RoadHdLaneLine } from "./lib/road-hd-lane-line";
import { RoadHdRoadEdge } from "./lib/road-hd-road-edge";
import { RoadHdIntersection } from "./lib/road-hd-intersection";
import { RoadHdPavementMarking } from "./lib/road-hd-pavement-marking";
import { RoadHdSign } from "./lib/road-hd-signs";
import { PBFLib } from "../shares/pbf/pbf.interface";
import { PBF } from "../shares/pbf/pbf";
import { RoadSdLink } from "./lib/road-sd-link";
import { RoadSdNode } from "./lib/road-sd-node";
import { RoadTraffic } from "./lib/road-traffic";
import { MAP_SOURCE } from "src/consts/map.const";
import { RoadTripTime } from "./lib/road-trip-time";
import { RoadWinterClosure } from "./lib/road-winter-closure";
import { RoadConstructionEvent } from "./lib/road-construction-event";
import { RoadEntryExit } from "./lib/road-entry-exit";
import { LoggerService } from "../util/logger/logger.service";
import { SchemaRelation } from "src/entities/version/schema-relation.entity";
import { RoadTrafficPBF } from "./lib/road-traffic-pbf";
import { WeatherWaterPBF } from "./lib/weather-water-pbf";
import { WeatherWindPBF } from "./lib/weather-wind-pbf";

@Injectable()
export class RoadService {
  /** 車線中心線・交通規制情報 */
  private roadHdLaneCenter: RoadHdLaneCenter;
  /** 区画線 */
  private roadHdLaneLine: RoadHdLaneLine;
  /** 道路縁 */
  private roadHdRoadEdge: RoadHdRoadEdge;
  /** 交差点 */
  private roadHdIntersection: RoadHdIntersection;
  /** 路面標識 */
  private roadHdPavementMarking: RoadHdPavementMarking;
  /** 道路標識 */
  private roadHdSign: RoadHdSign;
  /** SD道路リンク */
  private roadSdLink: RoadSdLink;
  /** SD道路ノード */
  private roadSdNode: RoadSdNode;
  /** 交通渋滞・規制情報 */
  private roadTraffic: RoadTraffic;
  private roadTrafficPBF: RoadTrafficPBF;
  /** 旅行時間情報 */
  private roadTripTime: RoadTripTime;
  /** 工事行事予定情報 */
  private roadConstructionEvent: RoadConstructionEvent;
  /** 冬季閉鎖情報 */
  private roadWinterClosure: RoadWinterClosure;
  /** 入口出口閉鎖情報 */
  private roadEntryExit: RoadEntryExit;
  /** 気象リスク水膜厚情報 */
  private weatherWaterPBF: WeatherWaterPBF;
  /** 気象リスク風速・風向情報 */
  private weatherWindPBF: WeatherWindPBF;
  private pbfLibs: PBFLib[] = [];
  private geojsonLibs: GeoJsonLib[] = [];

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly coordinateService: CoordinateService,
    private readonly schemaRelationService: SchemaRelationService,
    private readonly loggerService: LoggerService,
  ) {
    this.roadHdLaneCenter = new RoadHdLaneCenter();
    this.roadHdLaneLine = new RoadHdLaneLine();
    this.roadHdRoadEdge = new RoadHdRoadEdge();
    this.roadHdIntersection = new RoadHdIntersection();
    this.roadHdPavementMarking = new RoadHdPavementMarking();
    this.roadHdSign = new RoadHdSign();
    this.roadTraffic = new RoadTraffic();
    this.roadTripTime = new RoadTripTime();
    this.roadConstructionEvent = new RoadConstructionEvent();
    this.roadWinterClosure = new RoadWinterClosure();
    this.roadEntryExit = new RoadEntryExit();
    this.roadTrafficPBF = new RoadTrafficPBF();
    this.weatherWaterPBF = new WeatherWaterPBF();
    this.weatherWindPBF = new WeatherWindPBF();

    this.geojsonLibs = [
      this.roadHdLaneCenter,
      this.roadHdLaneLine,
      this.roadHdRoadEdge,
      this.roadHdIntersection,
      this.roadHdPavementMarking,
      this.roadHdSign,
      this.roadTripTime,
      this.roadConstructionEvent,
      this.roadWinterClosure,
      this.roadEntryExit,
    ];
    this.pbfLibs = [...this.geojsonLibs, this.roadTrafficPBF, this.weatherWaterPBF, this.weatherWindPBF];
    this.geojsonLibs.push(this.roadTraffic);

    this.roadSdLink = new RoadSdLink();
    this.pbfLibs.push(this.roadSdLink);

    this.roadSdNode = new RoadSdNode();
    this.pbfLibs.push(this.roadSdNode);
  }

  /**
   * リクエストの型がtimestampを保持しているかを確認
   * @param {object} condition - チェックするリクエストのオブジェクト。
   * @returns {boolean} - timestampを持っていれば true をそうでなければ false を返却。
   */
  hasTimestamp(condition: any): condition is { timestamp: string } {
    return "timestamp" in condition;
  }

  /**
   * GeoJSONデータを取得する共通関数
   *
   * @param {string} sourceId - 地図データの識別子
   * @param {CommonRoadGeoJSONGetQueryDTO | HdLaneCenterGeoJSONGetQueryDTO | CommonRoadGeoJSONGetWithoutTimestampQueryDTO | RoadGeoJSONWithTimestampGetQueryDTO} condition - リクエストクエリ
   * @returns {Promise<FeatureCollectionDto<T>>} - GeoJSONレスポンス
   * @throws {BadRequestException} - リクエストが不正
   * @throws {Error} - データの取得に失敗
   */
  async getGeoJSON<T>(
    sourceId: string,
    condition:
      | CommonRoadGeoJSONGetQueryDTO
      | HdLaneCenterGeoJSONGetQueryDTO
      | CommonRoadGeoJSONGetWithoutTimestampQueryDTO
      | RoadGeoJSONWithTimestampGetQueryDTO,
  ): Promise<FeatureCollectionDto<T>> {
    try {
      // bbox, voxel, city, meshの指定がない場合
      const geomKeys = ["bbox", "x", "y", "z", "f", "city", "mesh"];
      const hasGeomKeys = geomKeys.some((key) => condition?.hasOwnProperty(key));
      if (!hasGeomKeys) {
        throw new BadRequestException();
      }

      // バウンディングボックス（文字列として受け取ってしまうため、数値型の配列に変換）
      if (condition.bbox) {
        condition.bbox = String(condition.bbox).split(",").map(Number);
      }

      // 空間ID
      if (condition.x !== undefined && condition.y !== undefined && condition.z !== undefined) {
        const tile: ZFXYTile = {
          z: Number(condition.z),
          f: Number(condition.f) || 0,
          x: Number(condition.x),
          y: Number(condition.y),
        };

        // NOTE: Ouranosが用意するメソッドがオブジェクトの配列で返却するため、配列に変換
        const bbox = getBBox(tile).reduce((acc, obj) => {
          acc.push(obj.lng, obj.lat);
          return acc;
        }, []);
        condition.bbox = bbox;
      }

      // メッシュコード
      if (condition.mesh) {
        const bbox = this.coordinateService.transformMeshToBBox(condition.mesh);
        condition.bbox = bbox;
      }

      const geom = await CropMap.createCropMultiPolygon(this.dataSource, {
        // バウンディングボックス
        bbox: condition.bbox,
        // 行政区画コード
        cities: condition.city,
      });

      const targetLib = this.geojsonLibs.find((lib) => lib.sourceId === sourceId);
      if (!targetLib) {
        return null;
      }

      let schemaRelation: SchemaRelation;
      // NOTE: 工事行事予定情報および冬季閉鎖情報のリクエストにおけるtimestampは利用意図が異なるため、除外
      if (
        this.hasTimestamp(condition) &&
        targetLib.sourceId !== MAP_SOURCE.CONSTRUCTION_EVENT &&
        targetLib.sourceId !== MAP_SOURCE.WINTER_CLOSURE
      ) {
        schemaRelation = await this.schemaRelationService.getSchemaRelation(condition.timestamp);
      } else {
        schemaRelation = await this.schemaRelationService.getSchemaRelation();
      }

      const query = targetLib.createPropertiesQuery(this.dataSource.createQueryBuilder(), condition, schemaRelation);

      if (
        targetLib.sourceId === MAP_SOURCE.TRAFFIC ||
        targetLib.sourceId === MAP_SOURCE.WINTER_CLOSURE ||
        targetLib.sourceId === MAP_SOURCE.CONSTRUCTION_EVENT
      ) {
        query
          .addSelect(`ST_AsGeoJSON(ST_Intersection(ST_Transform(ST_GeomFromGeoJSON(:geojsonString), 6697), fh.geom))`, "geometry")
          .addGroupBy("fh.geom")
          .andWhere(`ST_Intersects(ST_Transform(ST_GeomFromGeoJSON(:geojsonString),6697), fh.geom)`)
          .setParameter("geojsonString", JSON.stringify(geom));
      } else {
        query
          .addSelect(`ST_AsGeoJSON(ST_Intersection(ST_Transform(ST_GeomFromGeoJSON(:geojsonString), 6697), tg.geom))`, "geometry")
          .andWhere(`ST_Intersects(ST_Transform(ST_GeomFromGeoJSON(:geojsonString),6697), tg.geom)`)
          .setParameter("geojsonString", JSON.stringify(geom));
      }

      const rows = await query.getRawMany();
      if (!rows || rows.length === 0) {
        return {
          type: "FeatureCollection",
          features: [],
        };
      }

      let geojson: FeatureCollectionDto<T>;

      // NOTE: テーブル側で座標情報が別々のカラムに保存されているため、データを取得した直後に変換
      if (
        targetLib.sourceId === MAP_SOURCE.TRAFFIC ||
        targetLib.sourceId === MAP_SOURCE.WINTER_CLOSURE ||
        targetLib.sourceId === MAP_SOURCE.CONSTRUCTION_EVENT
      ) {
        const modifiedRows = rows.map((row) => {
          return {
            ...row,
            /** 事象下流 */
            downstream: [row.downstreamLat, row.downstreamLon, row.downstreamHi],
            /** 事象上流 */
            upstream: [row.upstreamLat, row.upstreamLon, row.upstreamHi],
          };
        });
        geojson = Convert.rowsToGeojson<T>(modifiedRows);
      } else if (targetLib.sourceId === MAP_SOURCE.ENTRY_EXIT) {
        const modifiedRows = rows.map((row) => ({
          ...row,
          /** 入口出口 */
          location: [row.latitude, row.longitude, row.height],
        }));
        geojson = Convert.rowsToGeojson<T>(modifiedRows);
      } else {
        geojson = Convert.rowsToGeojson<T>(rows);
      }
      return geojson;
    } catch (error) {
      this.loggerService.error(error);
      throw error;
    }
  }

  /**
   * roadSegmentIdによる交通渋滞・規制情報のGeoJSONデータを取得する関数
   *
   * @param {string} sourceId - 地図データの識別子
   * @param {RoadExtraTrafficGetParamDTO} param - リクエストパラメーター
   * @returns {Promise<FeatureCollectionDto<T>>} - GeoJSONレスポンス
   * @throws {NotFoundException} - データが存在しない
   * @throws {Error} - データの取得に失敗
   */
  async getExtraTrafficGeoJSON<T>(sourceId: string, param: RoadExtraTrafficGetParamDTO): Promise<FeatureCollectionDto<T>> {
    try {
      const targetLib = this.geojsonLibs.find((lib) => lib.sourceId === sourceId);
      if (!targetLib) {
        return null;
      }

      const schemaRelation = await this.schemaRelationService.getSchemaRelation();
      const query = targetLib.createPropertiesQuery(this.dataSource.createQueryBuilder(), param, schemaRelation);
      query.addGroupBy("fh.geom");

      const rows = await query.getRawMany();

      if (!rows || rows.length === 0) {
        return {
          type: "FeatureCollection",
          features: [],
        };
      }

      const geojson = Convert.rowsToGeojson<T>(rows);

      return geojson;
    } catch (error) {
      this.loggerService.error(error);
      throw error;
    }
  }

  /**
   * PBF用属性取得用サブクエリ作成
   *
   * @param sourceId
   * @param query
   * @param timestamp
   * @returns
   */
  async createPBFBuffer(sourceId: string, x: number, y: number, z: number, timestamp?: string): Promise<Buffer> {
    const targetLib = this.pbfLibs.find((lib) => lib.sourceId === sourceId);
    if (!targetLib) {
      return null;
    }

    const schemaRelation = await this.schemaRelationService.getSchemaRelation(timestamp);

    const query = this.dataSource
      .createQueryBuilder()
      .from((qb) => {
        // NOTE: 絞り込み条件が存在しないため、第2引数は空のオブジェクトを渡しています。
        const subQuery = targetLib.createPropertiesQuery(qb.subQuery(), {}, schemaRelation);
        return PBF.addPBFGeometryQuery(subQuery, { x, y, z });
      }, "mvtgeom")
      .select(`ST_AsMVT(mvtgeom.*, :sourceId)`, "data")
      .setParameters({ sourceId });

    try {
      const result = await query.getRawOne();
      return result?.data || null;
    } catch (error) {
      if (error instanceof QueryFailedError && error.message.indexOf("ST_TileEnvelope: Invalid tile") >= 0) {
        this.loggerService.error(error);
        throw new BadRequestException();
      }
      this.loggerService.error(error);
      throw error;
    }
  }
}
